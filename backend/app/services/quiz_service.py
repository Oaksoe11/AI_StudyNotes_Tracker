import json
import re
from typing import Any

import google.generativeai as genai

from app.core.config import settings
from app.services.gemini_service import GeminiGenerationError


QUIZ_PROMPT = """
You are an expert teaching assistant creating a practice quiz from lecture slides.

Return only valid JSON. Do not wrap it in Markdown.

JSON shape:
{
  "title": "Practice quiz title",
  "questions": [
    {
      "level": "easy",
      "question": "Question text",
      "choices": ["A", "B", "C", "D"],
      "correct_answer": "Exact matching choice",
      "explanation": "Why this answer is correct",
      "page_reference": "Slide 1"
    }
  ]
}

Rules:
- Each question must have 4 choices.
- The correct_answer must exactly match one of the choices.
- Use page_reference when possible.
- Make questions useful for studying, not trick questions.
""".strip()

DIFFICULTY_RULES = {
    "mixed": "Create exactly 15 questions: 5 easy recall questions, 5 medium concept questions, and 5 hard application/analysis questions.",
    "easy": "Create exactly 15 easy questions focused on definitions, recall, and basic understanding. Set every level to easy.",
    "medium": "Create exactly 15 medium questions focused on explaining concepts, comparing ideas, and connecting details. Set every level to medium.",
    "hard": "Create exactly 15 hard questions focused on applying ideas, analyzing examples, and solving with the lecture concepts. Set every level to hard.",
}


def generate_quiz(slides: list[dict[str, Any]], note_content: str | None = None, difficulty: str = "mixed") -> dict[str, Any]:
    if not settings.gemini_api_key:
        raise GeminiGenerationError("AI is not configured yet. Add GEMINI_API_KEY on the backend and redeploy.")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)
    slide_text = "\n\n".join(
        f"Slide {slide['page_number']}:\n{slide.get('extracted_text') or slide.get('text') or '[No extractable text]'}"
        for slide in slides
    )
    note_context = f"\n\nGenerated notes:\n{note_content}" if note_content else ""
    difficulty = difficulty if difficulty in DIFFICULTY_RULES else "mixed"
    prompt = f"{QUIZ_PROMPT}\n\nDifficulty rules:\n{DIFFICULTY_RULES[difficulty]}\n\nLecture slides:\n{slide_text}{note_context}"

    try:
        response = model.generate_content(prompt)
    except Exception as exc:
        raise GeminiGenerationError(_friendly_gemini_error(exc)) from exc

    if not response.text:
        raise GeminiGenerationError("The AI returned an empty quiz response. Please try again.")

    quiz = _parse_quiz_json(response.text)
    questions = quiz.get("questions") or []

    if len(questions) < 15:
        raise GeminiGenerationError("The AI returned too few quiz questions. Please try again.")

    return {
        "title": quiz.get("title") or "Practice quiz",
        "questions": [_normalize_question(question, index, difficulty) for index, question in enumerate(questions[:15])],
    }


def _parse_quiz_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise GeminiGenerationError("The AI returned a quiz format the app could not read. Please try again.") from exc


def _normalize_question(question: dict[str, Any], index: int, difficulty: str = "mixed") -> dict[str, Any]:
    level = str(question.get("level") or "").lower()
    if difficulty in {"easy", "medium", "hard"}:
        level = difficulty
    if level not in {"easy", "medium", "hard"}:
        level = "easy" if index < 5 else "medium" if index < 10 else "hard"

    choices = question.get("choices") or []
    choices = [str(choice) for choice in choices[:4]]

    while len(choices) < 4:
        choices.append(f"Option {len(choices) + 1}")

    correct_answer = str(question.get("correct_answer") or choices[0])
    if correct_answer not in choices:
        correct_answer = choices[0]

    return {
        "level": level,
        "question": str(question.get("question") or f"Question {index + 1}"),
        "choices": choices,
        "correct_answer": correct_answer,
        "explanation": str(question.get("explanation") or "Review the referenced slide for the reasoning."),
        "page_reference": str(question.get("page_reference") or ""),
        "position": index + 1,
    }


def _friendly_gemini_error(exc: Exception) -> str:
    message = str(exc).lower()

    if "quota" in message or "rate" in message or "429" in message or "resource_exhausted" in message:
        return "Gemini is at its limit right now. Please wait a minute and try again."

    if "api key" in message or "permission" in message or "403" in message or "401" in message:
        return "The AI key is invalid or missing permission. Check GEMINI_API_KEY on the backend."

    if "timeout" in message or "deadline" in message:
        return "Gemini took too long to respond. Try again with fewer slides or try later."

    return "Gemini could not generate a quiz right now. Please try again shortly."

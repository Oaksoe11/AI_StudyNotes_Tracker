import json
import re
from typing import Any

import google.generativeai as genai

from app.core.config import settings
from app.services.gemini_service import GeminiGenerationError


QUIZ_PROMPT = """
You are an expert teaching assistant creating a practice quiz from lecture slides.

Create exactly 15 multiple-choice questions:
- 5 easy questions for recall and definitions
- 5 medium questions for explaining and comparing ideas
- 5 hard questions for applying, analyzing, or solving with the ideas

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


def generate_quiz(slides: list[dict[str, Any]], note_content: str | None = None) -> dict[str, Any]:
    if not settings.gemini_api_key:
        raise GeminiGenerationError("GEMINI_API_KEY is not configured.")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)
    slide_text = "\n\n".join(
        f"Slide {slide['page_number']}:\n{slide.get('extracted_text') or slide.get('text') or '[No extractable text]'}"
        for slide in slides
    )
    note_context = f"\n\nGenerated notes:\n{note_content}" if note_content else ""
    prompt = f"{QUIZ_PROMPT}\n\nLecture slides:\n{slide_text}{note_context}"

    try:
        response = model.generate_content(prompt)
    except Exception as exc:
        raise GeminiGenerationError(f"Gemini quiz generation failed: {exc}") from exc

    if not response.text:
        raise GeminiGenerationError("Gemini returned an empty quiz response.")

    quiz = _parse_quiz_json(response.text)
    questions = quiz.get("questions") or []

    if len(questions) < 15:
        raise GeminiGenerationError("Gemini returned fewer than 15 quiz questions.")

    return {
        "title": quiz.get("title") or "Practice quiz",
        "questions": [_normalize_question(question, index) for index, question in enumerate(questions[:15])],
    }


def _parse_quiz_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise GeminiGenerationError("Gemini returned quiz data that was not valid JSON.") from exc


def _normalize_question(question: dict[str, Any], index: int) -> dict[str, Any]:
    level = str(question.get("level") or "").lower()
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

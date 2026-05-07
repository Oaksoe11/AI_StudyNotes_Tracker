import google.generativeai as genai

from app.core.config import settings
from app.models.schemas import NoteTone


TONE_INSTRUCTIONS = {
    NoteTone.concise: "Write compact lecture notes with only the most important ideas.",
    NoteTone.detailed: "Write thorough lecture notes with definitions, examples, and structure.",
    NoteTone.exam_prep: "Write exam-focused notes with likely test points, formulas, and quick review bullets.",
    NoteTone.beginner: "Write beginner-friendly notes that explain jargon and build intuition.",
}


def generate_notes(slides: list[dict], tone: NoteTone) -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    slide_text = "\n\n".join(
        f"Slide {slide['page_number']}:\n{slide.get('text') or '[No extractable text]'}"
        for slide in slides
    )
    prompt = f"""
You are an expert teaching assistant.

{TONE_INSTRUCTIONS[tone]}

Turn the lecture slide content below into clean Markdown notes. Include:
- A meaningful title
- Key concepts
- Important definitions
- Examples or formulas when present
- A short review checklist

Lecture content:
{slide_text}
"""

    response = model.generate_content(prompt)
    return response.text or ""


import google.generativeai as genai

from app.core.config import settings
from app.models.schemas import NoteTone


class GeminiGenerationError(RuntimeError):
    pass


BASE_PROMPT = """
You are an expert teaching assistant creating Markdown lecture notes from slide content.

Use page numbers when referencing specific slides. Explain diagrams, charts, code screenshots,
and visual layouts when slide images are attached. Prefer accurate, student-useful notes over
generic summaries.

Return structured Markdown with:
- A meaningful title
- Key concepts
- Important definitions
- Examples, equations, or algorithms when present
- Diagram or visual explanations when useful
- A short review checklist
""".strip()

TONE_PROMPTS = {
    NoteTone.concise: "Write compact lecture notes with only the most important ideas.",
    NoteTone.detailed: "Write thorough lecture notes with definitions, examples, and structure.",
    NoteTone.exam_prep: "Write exam-focused notes with likely test points, formulas, and quick review bullets.",
    NoteTone.beginner: "Write beginner-friendly notes that explain jargon and build intuition.",
}


def generate_notes(slides: list[dict], tone: NoteTone = NoteTone.concise) -> str:
    if not settings.gemini_api_key:
        raise GeminiGenerationError("GEMINI_API_KEY is not configured.")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    prompt = _build_prompt(slides, tone)
    parts: list[dict | str] = [prompt]

    for slide in _slides_with_images(slides):
        parts.append(f"Slide {slide['page_number']} image for visual context:")
        parts.append(
            {
                "mime_type": "image/png",
                "data": slide["image_bytes"],
            }
        )

    try:
        response = model.generate_content(parts)
    except Exception as exc:
        if len(parts) > 1:
            return _generate_text_only_notes(model, prompt)
        raise GeminiGenerationError(f"Gemini generation failed: {exc}") from exc

    if not response.text:
        raise GeminiGenerationError("Gemini returned an empty response.")

    return response.text


def _build_prompt(slides: list[dict], tone: NoteTone) -> str:
    slide_text = "\n\n".join(
        f"Slide {slide['page_number']}:\n{slide.get('extracted_text') or slide.get('text') or '[No extractable text]'}"
        for slide in slides
    )
    return f"{BASE_PROMPT}\n\nTone rules:\n{TONE_PROMPTS.get(tone, TONE_PROMPTS[NoteTone.concise])}\n\nLecture content:\n{slide_text}"


def _generate_text_only_notes(model, prompt: str) -> str:
    try:
        response = model.generate_content(
            f"{prompt}\n\nNote: Image analysis failed, so create the best possible notes from the extracted slide text only."
        )
    except Exception as exc:
        raise GeminiGenerationError(f"Gemini generation failed: {exc}") from exc

    if not response.text:
        raise GeminiGenerationError("Gemini returned an empty response.")

    return response.text


def _slides_with_images(slides: list[dict]) -> list[dict]:
    slides_with_bytes = [slide for slide in slides if slide.get("image_bytes")]
    no_text_slides = [slide for slide in slides_with_bytes if not (slide.get("extracted_text") or slide.get("text"))]
    remaining = [slide for slide in slides_with_bytes if slide.get("extracted_text") or slide.get("text")]
    return [*no_text_slides, *remaining][: settings.gemini_max_images]

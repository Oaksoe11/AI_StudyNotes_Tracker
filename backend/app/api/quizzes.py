from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.models.schemas import GenerateQuizRequest
from app.services.gemini_service import GeminiGenerationError
from app.services.quiz_service import generate_quiz

router = APIRouter()


@router.get("")
def list_quizzes(current_user: dict = Depends(get_current_user)) -> list[dict]:
    supabase = get_supabase()
    response = (
        supabase.table("quizzes")
        .select("*, documents(title,file_name)")
        .eq("user_id", current_user["id"])
        .eq("is_saved", True)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.post("/generate")
def generate_document_quiz(payload: GenerateQuizRequest, current_user: dict = Depends(get_current_user)) -> dict:
    if not payload.document_id and not payload.note_id:
        raise HTTPException(status_code=400, detail="document_id or note_id is required.")

    supabase = get_supabase()
    note = None
    document_id = payload.document_id

    if payload.note_id:
        note_response = (
            supabase.table("notes")
            .select("*")
            .eq("id", payload.note_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        note = note_response.data
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        document_id = note["document_id"]

    document_response = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    document = document_response.data
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        slides_response = (
            supabase.table("slides")
            .select("*")
            .eq("document_id", document["id"])
            .order("page_number")
            .execute()
        )
    except Exception:
        slides_response = (
            supabase.table("document_pages")
            .select("*")
            .eq("document_id", document["id"])
            .order("page_number")
            .execute()
        )

    if not slides_response.data:
        raise HTTPException(status_code=400, detail="Extract PDF content before generating a quiz.")

    try:
        quiz_data = generate_quiz(slides_response.data, note.get("content") if note else None, payload.difficulty)
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    quiz_response = (
        supabase.table("quizzes")
        .insert(
            {
                "user_id": current_user["id"],
                "folder_id": document["folder_id"],
                "document_id": document["id"],
                "note_id": note["id"] if note else None,
                "title": quiz_data["title"],
                "difficulty": payload.difficulty,
                "is_saved": payload.save_quiz,
            }
        )
        .execute()
    )
    quiz = quiz_response.data[0]
    question_rows = [{**question, "quiz_id": quiz["id"]} for question in quiz_data["questions"]]
    questions_response = supabase.table("quiz_questions").insert(question_rows).execute()

    return {"quiz_id": quiz["id"], "quiz": quiz, "questions": questions_response.data}


@router.get("/{quiz_id}")
def get_quiz(quiz_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    quiz_response = (
        supabase.table("quizzes")
        .select("*, documents(title,file_name)")
        .eq("id", quiz_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    quiz = quiz_response.data

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions_response = (
        supabase.table("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz_id)
        .order("position")
        .execute()
    )

    return {"quiz": quiz, "questions": questions_response.data}

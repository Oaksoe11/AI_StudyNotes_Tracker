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
    # List only saved quizzes for the current user.
    # Unsaved quizzes can still be opened right after generation, but they do not clutter the list.
    response = (
        supabase.table("quizzes")
        .select("*, documents(title,file_name), folders(name)")
        .eq("user_id", current_user["id"])
        .eq("is_saved", True)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.post("/generate")
def generate_document_quiz(payload: GenerateQuizRequest, current_user: dict = Depends(get_current_user)) -> dict:
    # A quiz needs either a document or a note as its source.
    if not payload.document_id and not payload.note_id:
        raise HTTPException(status_code=400, detail="document_id or note_id is required.")

    supabase = get_supabase()
    note = None
    document_id = payload.document_id

    if payload.note_id:
        # If we start from a note, first load the note and use its document_id.
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

    # Always load the source document so we know the folder and ownership.
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
        # Prefer the new slides table for extracted text.
        slides_response = (
            supabase.table("slides")
            .select("*")
            .eq("document_id", document["id"])
            .order("page_number")
            .execute()
        )
    except Exception:
        # Fallback for older local database versions.
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
        # Ask Gemini to make questions from slide text and optional note content.
        quiz_data = generate_quiz(slides_response.data, note.get("content") if note else None, payload.difficulty)
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # First save the quiz header row.
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
    # Then save the 15 question rows linked back to that quiz.
    question_rows = [{**question, "quiz_id": quiz["id"]} for question in quiz_data["questions"]]
    questions_response = supabase.table("quiz_questions").insert(question_rows).execute()

    return {"quiz_id": quiz["id"], "quiz": quiz, "questions": questions_response.data}


@router.get("/{quiz_id}")
def get_quiz(quiz_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    # Load the quiz with its source folder/document names for display.
    quiz_response = (
        supabase.table("quizzes")
        .select("*, documents(title,file_name), folders(name)")
        .eq("id", quiz_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    quiz = quiz_response.data

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Questions are stored separately so a quiz can have many question records.
    questions_response = (
        supabase.table("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz_id)
        .order("position")
        .execute()
    )

    return {"quiz": quiz, "questions": questions_response.data}


@router.patch("/{quiz_id}")
def update_quiz(quiz_id: str, payload: dict, current_user: dict = Depends(get_current_user)) -> dict:
    # Only these two quiz fields are editable from the frontend.
    allowed = {key: payload[key] for key in ("title", "is_saved") if key in payload}
    if not allowed:
        raise HTTPException(status_code=400, detail="No quiz fields to update.")
    if "title" in allowed:
        # Do not let the quiz title become blank.
        allowed["title"] = str(allowed["title"]).strip()
        if not allowed["title"]:
            raise HTTPException(status_code=400, detail="Quiz title is required.")

    supabase = get_supabase()
    # The user_id filter keeps users from renaming each other's quizzes.
    response = (
        supabase.table("quizzes")
        .update(allowed)
        .eq("id", quiz_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return response.data[0]


@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    # Delete only the quiz owned by this user. Questions should cascade in the database.
    response = (
        supabase.table("quizzes")
        .delete()
        .eq("id", quiz_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return {"deleted": True, "quiz_id": quiz_id}

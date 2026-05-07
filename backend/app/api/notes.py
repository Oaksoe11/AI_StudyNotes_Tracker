from fastapi import APIRouter, HTTPException

from app.core.supabase import get_supabase
from app.models.schemas import GenerateNotesRequest
from app.services.gemini_service import generate_notes

router = APIRouter()


@router.get("")
def list_notes() -> list[dict]:
    supabase = get_supabase()
    response = supabase.table("notes").select("*").order("created_at", desc=True).execute()
    return response.data


@router.post("/generate")
def generate_document_notes(payload: GenerateNotesRequest) -> dict:
    supabase = get_supabase()
    document_response = supabase.table("documents").select("*").eq("id", payload.document_id).single().execute()
    document = document_response.data

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    pages_response = (
        supabase.table("document_pages")
        .select("*")
        .eq("document_id", payload.document_id)
        .order("page_number")
        .execute()
    )

    if not pages_response.data:
        raise HTTPException(status_code=400, detail="Extract PDF content before generating notes.")

    content = generate_notes(pages_response.data, payload.tone)
    note_response = supabase.table("notes").insert(
        {
            "folder_id": document["folder_id"],
            "document_id": payload.document_id,
            "title": payload.title or document["file_name"].removesuffix(".pdf"),
            "tone": payload.tone.value,
            "content": content,
        }
    ).execute()

    supabase.table("documents").update({"status": "notes_ready"}).eq("id", payload.document_id).execute()

    return note_response.data[0]


@router.get("/{note_id}")
def get_note(note_id: str) -> dict:
    supabase = get_supabase()
    response = supabase.table("notes").select("*").eq("id", note_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Note not found")

    return response.data


@router.patch("/{note_id}")
def update_note(note_id: str, payload: dict) -> dict:
    supabase = get_supabase()
    allowed = {key: payload[key] for key in ("title", "content") if key in payload}
    response = supabase.table("notes").update(allowed).eq("id", note_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Note not found")

    return response.data[0]


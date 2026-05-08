from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.supabase import get_supabase
from app.models.schemas import DocumentStatus, GenerateNotesRequest, NoteTone
from app.services.gemini_service import GeminiGenerationError, generate_notes

router = APIRouter()


@router.get("")
def list_notes(current_user: dict = Depends(get_current_user)) -> list[dict]:
    supabase = get_supabase()
    response = (
        supabase.table("notes")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.post("/generate")
def generate_document_notes(payload: GenerateNotesRequest, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    document_response = (
        supabase.table("documents")
        .select("*")
        .eq("id", payload.document_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    document = document_response.data

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    tone = payload.tone or NoteTone(document.get("selected_tone") or NoteTone.concise.value)
    supabase.table("documents").update(
        {
            "status": DocumentStatus.generating.value,
            "selected_tone": tone.value,
            "failure_reason": None,
        }
    ).eq("id", payload.document_id).execute()

    try:
        try:
            pages_response = (
                supabase.table("slides")
                .select("*")
                .eq("document_id", payload.document_id)
                .order("page_number")
                .execute()
            )
        except Exception:
            pages_response = (
                supabase.table("document_pages")
                .select("*")
                .eq("document_id", payload.document_id)
                .order("page_number")
                .execute()
            )

        if not pages_response.data:
            raise HTTPException(status_code=400, detail="Extract PDF content before generating notes.")

        slides = _attach_slide_images(supabase, pages_response.data)
        content = generate_notes(slides, tone)
        note_response = supabase.table("notes").insert(
            {
                "folder_id": document["folder_id"],
                "document_id": payload.document_id,
                "user_id": current_user["id"],
                "title": payload.title or document.get("title") or document["file_name"].removesuffix(".pdf"),
                "tone": tone.value,
                "content": content,
            }
        ).execute()

        note = note_response.data[0]
        supabase.table("documents").update(
            {"status": DocumentStatus.completed.value, "failure_reason": None}
        ).eq("id", payload.document_id).execute()

        return {"note_id": note["id"], "note": note}
    except HTTPException as exc:
        supabase.table("documents").update(
            {"status": DocumentStatus.failed.value, "failure_reason": exc.detail}
        ).eq("id", payload.document_id).execute()
        raise
    except GeminiGenerationError as exc:
        supabase.table("documents").update(
            {"status": DocumentStatus.failed.value, "failure_reason": str(exc)}
        ).eq("id", payload.document_id).execute()
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        supabase.table("documents").update(
            {
                "status": DocumentStatus.failed.value,
                "failure_reason": f"Note generation failed: {exc}",
            }
        ).eq("id", payload.document_id).execute()
        raise HTTPException(status_code=500, detail="Note generation failed.") from exc


@router.get("/{note_id}")
def get_note(note_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    try:
        response = (
            supabase.table("notes")
            .select("*, documents(folder_id,title,file_name)")
            .eq("id", note_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Note not found") from exc

    if not response.data:
        raise HTTPException(status_code=404, detail="Note not found")

    return response.data


@router.patch("/{note_id}")
def update_note(note_id: str, payload: dict, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    allowed = {key: payload[key] for key in ("title", "content") if key in payload}
    if not allowed:
        raise HTTPException(status_code=400, detail="No note fields to update.")
    if "title" in allowed:
        allowed["title"] = str(allowed["title"]).strip()
        if not allowed["title"]:
            raise HTTPException(status_code=400, detail="Note title is required.")

    response = (
        supabase.table("notes")
        .update(allowed)
        .eq("id", note_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Note not found")

    return response.data[0]


@router.delete("/{note_id}")
def delete_note(note_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    response = (
        supabase.table("notes")
        .delete()
        .eq("id", note_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Note not found")

    return {"deleted": True, "note_id": note_id}


def _attach_slide_images(supabase, slides: list[dict]) -> list[dict]:
    enriched = []

    for index, slide in enumerate(slides):
        if index < settings.gemini_max_images and slide.get("image_storage_path"):
            image_bytes = supabase.storage.from_(settings.supabase_storage_bucket).download(
                slide["image_storage_path"]
            )
            enriched.append({**slide, "image_bytes": image_bytes})
        else:
            enriched.append(slide)

    return enriched

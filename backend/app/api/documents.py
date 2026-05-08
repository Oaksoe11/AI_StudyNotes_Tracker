from pathlib import PurePath
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.supabase import get_supabase
from app.models.schemas import DocumentStatus, NoteTone
from app.services.pdf_service import extract_pdf_pages
from app.services.storage_service import ensure_storage_bucket, get_public_url, remove_storage_objects, upload_bytes

router = APIRouter()


@router.get("")
def list_documents(current_user: dict = Depends(get_current_user)) -> list[dict]:
    supabase = get_supabase()
    response = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    folder_id: str = Form(...),
    tone: NoteTone = Form(NoteTone.concise),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    pdf_bytes = await file.read()
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF.")

    document_id = str(uuid4())
    filename = _safe_pdf_filename(file.filename)
    storage_path = f"{folder_id}/{document_id}/{filename}"
    supabase = get_supabase()
    folder_response = (
        supabase.table("folders")
        .select("id")
        .eq("id", folder_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )

    if not folder_response.data:
        raise HTTPException(status_code=404, detail="Folder not found")

    upload_bytes(
        supabase,
        storage_path,
        pdf_bytes,
        "application/pdf",
    )
    file_url = get_public_url(supabase, storage_path)

    document_row = {
        "id": document_id,
        "user_id": current_user["id"],
        "folder_id": folder_id,
        "title": filename.removesuffix(".pdf"),
        "file_name": filename,
        "storage_path": storage_path,
        "file_url": file_url,
        "selected_tone": tone.value,
        "status": DocumentStatus.uploaded.value,
    }

    try:
        document_response = supabase.table("documents").insert(document_row).execute()
    except Exception:
        document_row.pop("title", None)
        document_response = supabase.table("documents").insert(document_row).execute()

    document = document_response.data[0]
    background_tasks.add_task(process_document_extraction, document["id"], current_user["id"])

    return {
        "document_id": document["id"],
        "document": document,
        "processing_started": True,
    }


@router.post("/{document_id}/extract")
def extract_document(document_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    try:
        page_count = process_document_extraction(document_id, current_user["id"], raise_errors=True)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="PDF extraction failed.") from exc

    return {"document_id": document_id, "page_count": page_count}


@router.delete("/{document_id}")
def delete_document(document_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    try:
        document_response = (
            supabase.table("documents")
            .select("id,storage_path")
            .eq("id", document_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Document not found") from exc

    if not document_response.data:
        raise HTTPException(status_code=404, detail="Document not found")

    storage_paths = [document_response.data.get("storage_path")]
    try:
        slides_response = supabase.table("slides").select("image_storage_path").eq("document_id", document_id).execute()
    except Exception:
        slides_response = supabase.table("document_pages").select("image_storage_path").eq("document_id", document_id).execute()
    storage_paths.extend(slide.get("image_storage_path") for slide in slides_response.data or [])

    response = (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        remove_storage_objects(supabase, [path for path in storage_paths if path])
    except Exception:
        pass

    return {"deleted": True, "document_id": document_id}


def process_document_extraction(document_id: str, user_id: str | None = None, raise_errors: bool = False) -> int:
    supabase = get_supabase()
    document_query = supabase.table("documents").select("*").eq("id", document_id)
    if user_id:
        document_query = document_query.eq("user_id", user_id)
    document_response = document_query.single().execute()
    document = document_response.data

    if not document:
        if raise_errors:
            raise ValueError("Document not found")
        return 0

    supabase.table("documents").update(
        {"status": DocumentStatus.extracting.value, "failure_reason": None}
    ).eq("id", document_id).execute()

    try:
        pdf_bytes = supabase.storage.from_(settings.supabase_storage_bucket).download(document["storage_path"])
        pages = extract_pdf_pages(
            pdf_bytes,
            max_pages=settings.pdf_max_pages,
            image_scale=settings.pdf_image_scale,
        )

        slide_bucket = f"{document['folder_id']}/{document_id}/slides"
        page_rows = []
        ensure_storage_bucket(supabase)

        for page in pages:
            image_storage_path = f"{slide_bucket}/{page['image_name']}"
            upload_bytes(supabase, image_storage_path, page["image_bytes"], "image/png", ensure_bucket=False)
            page_rows.append(
                {
                    "document_id": document_id,
                    "page_number": page["page_number"],
                    "extracted_text": page["text"],
                    "image_storage_path": image_storage_path,
                    "image_url": get_public_url(supabase, image_storage_path),
                }
            )

        if page_rows:
            try:
                supabase.table("slides").upsert(page_rows, on_conflict="document_id,page_number").execute()
            except Exception:
                legacy_page_rows = [
                    {
                        **row,
                        "text": row["extracted_text"],
                    }
                    for row in page_rows
                ]
                for row in legacy_page_rows:
                    row.pop("extracted_text", None)
                supabase.table("document_pages").upsert(
                    legacy_page_rows,
                    on_conflict="document_id,page_number",
                ).execute()

        remove_storage_objects(supabase, [document["storage_path"]])

        supabase.table("documents").update(
            {
                "status": DocumentStatus.uploaded.value,
                "page_count": len(page_rows),
                "file_url": None,
                "failure_reason": None,
            }
        ).eq("id", document_id).execute()
    except Exception as exc:
        supabase.table("documents").update(
            {
                "status": DocumentStatus.failed.value,
                "failure_reason": f"PDF extraction failed: {exc}",
            }
        ).eq("id", document_id).execute()
        if raise_errors:
            raise
        return 0

    return len(page_rows)


@router.get("/{document_id}")
def get_document(document_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    document_response = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )
    if not document_response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        pages_response = supabase.table("slides").select("*").eq("document_id", document_id).order("page_number").execute()
    except Exception:
        pages_response = supabase.table("document_pages").select("*").eq("document_id", document_id).order("page_number").execute()
    notes_response = (
        supabase.table("notes")
        .select("*")
        .eq("document_id", document_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    return {
        "document": document_response.data,
        "slides": pages_response.data,
        "pages": pages_response.data,
        "notes": notes_response.data,
    }


def _safe_pdf_filename(filename: str | None) -> str:
    name = PurePath(filename or "lecture.pdf").name.strip().replace("\x00", "")
    if not name:
        name = "lecture.pdf"
    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf"
    return name

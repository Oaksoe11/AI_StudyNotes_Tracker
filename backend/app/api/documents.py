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
    # Get a Supabase client so this route can talk to the database.
    supabase = get_supabase()
    # Only return documents that belong to the logged-in user.
    # This is important because every student should only see their own uploads.
    response = (
        supabase.table("documents")
        .select("id,title,file_name,status,created_at")
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
    # The browser sends a content type, but we still check it before reading the file.
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    # Read the uploaded PDF into memory so we can upload it to Supabase Storage.
    pdf_bytes = await file.read()
    # A fake upload could lie about its content type, so this checks the PDF file header too.
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF.")

    # Make a fresh id for the document before saving anything.
    # We use this id in both the database row and the storage path.
    document_id = str(uuid4())
    # Clean the filename so a weird filename cannot create a weird storage path.
    filename = _safe_pdf_filename(file.filename)
    storage_path = f"{folder_id}/{document_id}/{filename}"
    supabase = get_supabase()
    # Make sure the folder really belongs to this user before saving the PDF there.
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

    # Upload the original PDF first. Later, after extraction works, we delete this original file.
    upload_bytes(
        supabase,
        storage_path,
        pdf_bytes,
        "application/pdf",
    )
    file_url = get_public_url(supabase, storage_path)

    # This is the database record that represents the uploaded PDF.
    # The selected tone is saved so note generation can reuse it later.
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
        # Newer schema has a title column, so this should usually work.
        document_response = supabase.table("documents").insert(document_row).execute()
    except Exception:
        # Older local databases might not have title yet, so this fallback keeps the MVP usable.
        document_row.pop("title", None)
        document_response = supabase.table("documents").insert(document_row).execute()

    document = document_response.data[0]
    # FastAPI runs this after the response is returned, so the upload feels faster to the user.
    background_tasks.add_task(process_document_extraction, document["id"], current_user["id"])

    return {
        "document_id": document["id"],
        "document": document,
        "processing_started": True,
    }


@router.post("/{document_id}/extract")
def extract_document(document_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    try:
        # Manual extraction route for retry/debugging. Normal uploads already start this in the background.
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
        # First fetch the document so we know which storage files should be cleaned up.
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

    # Start with the original PDF path. It may already be deleted after extraction, which is okay.
    storage_paths = [document_response.data.get("storage_path")]
    try:
        # Collect generated slide images so deleting the document does not leave old files behind.
        slides_response = supabase.table("slides").select("image_storage_path").eq("document_id", document_id).execute()
    except Exception:
        # Some early versions used document_pages, so keep the fallback for older databases.
        slides_response = supabase.table("document_pages").select("image_storage_path").eq("document_id", document_id).execute()
    storage_paths.extend(slide.get("image_storage_path") for slide in slides_response.data or [])

    # Delete the database row. Related rows should cascade because of the database schema.
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
        # Clean Supabase Storage after the database delete.
        # If storage cleanup fails, the document is still deleted, so we do not break the user action.
        remove_storage_objects(supabase, [path for path in storage_paths if path])
    except Exception:
        pass

    return {"deleted": True, "document_id": document_id}


@router.get("/{document_id}/status")
def get_document_status(document_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    # Student note:
    # This tiny endpoint is for live progress polling.
    # It returns only the fields the progress bar needs instead of the full document, slides, and notes.
    document_response = (
        supabase.table("documents")
        .select("id,status,page_count,failure_reason,processing_step,processing_current,processing_total")
        .eq("id", document_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )

    if not document_response.data:
        raise HTTPException(status_code=404, detail="Document not found")

    notes_response = (
        supabase.table("notes")
        .select("id")
        .eq("document_id", document_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    return {
        **document_response.data,
        "note_count": len(notes_response.data or []),
    }


def process_document_extraction(document_id: str, user_id: str | None = None, raise_errors: bool = False) -> int:
    supabase = get_supabase()
    # Look up the document. When user_id is passed, this also protects against cross-user access.
    document_query = supabase.table("documents").select("*").eq("id", document_id)
    if user_id:
        document_query = document_query.eq("user_id", user_id)
    document_response = document_query.single().execute()
    document = document_response.data

    if not document:
        # Background tasks should quietly stop, but manual retry should get a clear error.
        if raise_errors:
            raise ValueError("Document not found")
        return 0

    # Tell the UI that extraction started.
    _update_document_progress(
        supabase,
        document_id,
        status=DocumentStatus.extracting.value,
        step="Starting extraction",
        current=0,
        total=0,
        failure_reason=None,
    )

    try:
        # Download the original PDF from storage so PyMuPDF can read it.
        pdf_bytes = supabase.storage.from_(settings.supabase_storage_bucket).download(document["storage_path"])
        # Extract text and render page images. Settings cap this at a small number for MVP speed.
        pages = extract_pdf_pages(
            pdf_bytes,
            max_pages=settings.pdf_max_pages,
            image_scale=settings.pdf_image_scale,
            progress_callback=lambda current, total: _update_document_progress(
                supabase,
                document_id,
                status=DocumentStatus.extracting.value,
                step="Extracting slide text and images",
                current=current,
                total=total,
            ),
        )

        slide_bucket = f"{document['folder_id']}/{document_id}/slides"
        page_rows = []
        ensure_storage_bucket(supabase)

        for index, page in enumerate(pages, start=1):
            _update_document_progress(
                supabase,
                document_id,
                status=DocumentStatus.extracting.value,
                step="Saving slide images",
                current=index,
                total=len(pages),
            )
            # Each rendered slide image gets its own storage path.
            image_storage_path = f"{slide_bucket}/{page['image_name']}"
            upload_bytes(supabase, image_storage_path, page["image_bytes"], "image/png", ensure_bucket=False)
            # Store the page number, extracted text, and image URL together.
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
                # Main table for extracted slide data.
                supabase.table("slides").upsert(page_rows, on_conflict="document_id,page_number").execute()
            except Exception:
                # Older database version used document_pages and called the text column "text".
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

        # After extraction, we only keep filename + slide data, not the original PDF.
        remove_storage_objects(supabase, [document["storage_path"]])

        # Mark extraction as ready. In this MVP, uploaded means "ready to generate notes".
        _update_document_progress(
            supabase,
            document_id,
            status=DocumentStatus.uploaded.value,
            step="Extraction complete",
            current=len(page_rows),
            total=len(page_rows),
            page_count=len(page_rows),
            file_url=None,
            failure_reason=None,
        )
    except Exception as exc:
        # Save the error reason so the frontend can show what went wrong.
        _update_document_progress(
            supabase,
            document_id,
            status=DocumentStatus.failed.value,
            step="Extraction failed",
            failure_reason=f"PDF extraction failed: {exc}",
        )
        if raise_errors:
            raise
        return 0

    return len(page_rows)


@router.get("/{document_id}")
def get_document(document_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    # Load one document, but only if it belongs to the logged-in user.
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
        # Prefer the new slides table.
        pages_response = supabase.table("slides").select("*").eq("document_id", document_id).order("page_number").execute()
    except Exception:
        # Keep older local databases working.
        pages_response = supabase.table("document_pages").select("*").eq("document_id", document_id).order("page_number").execute()
    # Also load notes linked to this PDF so the detail page can show them.
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
    # PurePath strips folders from names like "../../lecture.pdf".
    name = PurePath(filename or "lecture.pdf").name.strip().replace("\x00", "")
    if not name:
        name = "lecture.pdf"
    # Storage code expects this to be a PDF filename.
    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf"
    return name


def _update_document_progress(
    supabase,
    document_id: str,
    *,
    status: str | None = None,
    step: str | None = None,
    current: int | None = None,
    total: int | None = None,
    page_count: int | None = None,
    file_url: str | None = None,
    failure_reason: str | None = None,
) -> None:
    # Student note:
    # This helper updates the document row with progress info for the UI.
    # It also has a fallback so older databases without progress columns still work.
    updates = {}
    if status is not None:
        updates["status"] = status
    if page_count is not None:
        updates["page_count"] = page_count
    if file_url is not None or file_url is None and page_count is not None:
        updates["file_url"] = file_url
    if failure_reason is not None:
        updates["failure_reason"] = failure_reason
    elif status in {DocumentStatus.extracting.value, DocumentStatus.uploaded.value}:
        updates["failure_reason"] = None

    progress_updates = {
        **updates,
        "processing_step": step,
        "processing_current": current,
        "processing_total": total,
    }

    try:
        supabase.table("documents").update(progress_updates).eq("id", document_id).execute()
    except Exception:
        # If the deployment has not run the newest schema migration yet,
        # still update the basic status fields instead of failing extraction.
        if updates:
            supabase.table("documents").update(updates).eq("id", document_id).execute()

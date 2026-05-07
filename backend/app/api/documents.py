from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.core.supabase import get_supabase
from app.models.schemas import DocumentStatus, NoteTone
from app.services.pdf_service import extract_pdf_pages
from app.services.storage_service import get_public_url, upload_bytes

router = APIRouter()


@router.get("")
def list_documents() -> list[dict]:
    supabase = get_supabase()
    response = supabase.table("documents").select("*").order("created_at", desc=True).execute()
    return response.data


@router.post("/upload")
async def upload_document(
    folder_id: str = Form(...),
    tone: NoteTone = Form(NoteTone.concise),
    file: UploadFile = File(...),
) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    pdf_bytes = await file.read()
    document_id = str(uuid4())
    storage_path = f"{folder_id}/{document_id}/{file.filename}"
    supabase = get_supabase()

    upload_bytes(
        supabase,
        storage_path,
        pdf_bytes,
        "application/pdf",
    )
    file_url = get_public_url(supabase, storage_path)

    document_row = {
        "id": document_id,
        "folder_id": folder_id,
        "title": file.filename.removesuffix(".pdf"),
        "file_name": file.filename,
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
    return {"document_id": document["id"], "document": document}


@router.post("/{document_id}/extract")
def extract_document(document_id: str) -> dict:
    supabase = get_supabase()
    document_response = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    document = document_response.data

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    supabase.table("documents").update(
        {"status": DocumentStatus.extracting.value, "failure_reason": None}
    ).eq("id", document_id).execute()

    try:
        pdf_bytes = supabase.storage.from_(settings.supabase_storage_bucket).download(document["storage_path"])
        pages = extract_pdf_pages(pdf_bytes)

        slide_bucket = f"{document['folder_id']}/{document_id}/slides"
        page_rows = []

        for page in pages:
            image_storage_path = f"{slide_bucket}/{page['image_name']}"
            upload_bytes(supabase, image_storage_path, page["image_bytes"], "image/png")
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

        supabase.table("documents").update(
            {
                "status": DocumentStatus.uploaded.value,
                "page_count": len(page_rows),
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
        raise HTTPException(status_code=500, detail="PDF extraction failed.") from exc

    return {"document_id": document_id, "page_count": len(page_rows)}


@router.get("/{document_id}")
def get_document(document_id: str) -> dict:
    supabase = get_supabase()
    document_response = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    try:
        pages_response = supabase.table("slides").select("*").eq("document_id", document_id).order("page_number").execute()
    except Exception:
        pages_response = supabase.table("document_pages").select("*").eq("document_id", document_id).order("page_number").execute()
    notes_response = supabase.table("notes").select("*").eq("document_id", document_id).execute()

    return {
        "document": document_response.data,
        "slides": pages_response.data,
        "pages": pages_response.data,
        "notes": notes_response.data,
    }

from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.core.supabase import get_supabase
from app.services.pdf_service import extract_pdf_pages

router = APIRouter()


@router.get("")
def list_documents() -> list[dict]:
    supabase = get_supabase()
    response = supabase.table("documents").select("*").order("created_at", desc=True).execute()
    return response.data


@router.post("/upload")
async def upload_document(folder_id: str = Form(...), file: UploadFile = File(...)) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    pdf_bytes = await file.read()
    document_id = str(uuid4())
    storage_path = f"{folder_id}/{document_id}/{file.filename}"
    supabase = get_supabase()

    supabase.storage.from_(settings.supabase_storage_bucket).upload(
        storage_path,
        pdf_bytes,
        {"content-type": "application/pdf"},
    )

    document_response = supabase.table("documents").insert(
        {
            "id": document_id,
            "folder_id": folder_id,
            "file_name": file.filename,
            "storage_path": storage_path,
            "status": "uploaded",
        }
    ).execute()

    return document_response.data[0]


@router.post("/{document_id}/extract")
def extract_document(document_id: str) -> dict:
    supabase = get_supabase()
    document_response = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    document = document_response.data

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    pdf_bytes = supabase.storage.from_(settings.supabase_storage_bucket).download(document["storage_path"])
    pages = extract_pdf_pages(pdf_bytes)

    slide_bucket = f"{document['folder_id']}/{document_id}/slides"
    page_rows = [
        {
            "document_id": document_id,
            "page_number": page["page_number"],
            "text": page["text"],
            "image_storage_path": f"{slide_bucket}/{page['image_name']}",
        }
        for page in pages
    ]

    for page in pages:
        supabase.storage.from_(settings.supabase_storage_bucket).upload(
            f"{slide_bucket}/{page['image_name']}",
            page["image_bytes"],
            {"content-type": "image/png"},
        )

    if page_rows:
        supabase.table("document_pages").insert(page_rows).execute()

    supabase.table("documents").update(
        {"status": "extracted", "page_count": len(page_rows)}
    ).eq("id", document_id).execute()

    return {"document_id": document_id, "page_count": len(page_rows)}


@router.get("/{document_id}")
def get_document(document_id: str) -> dict:
    supabase = get_supabase()
    document_response = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    pages_response = supabase.table("document_pages").select("*").eq("document_id", document_id).execute()
    notes_response = supabase.table("notes").select("*").eq("document_id", document_id).execute()

    return {
        "document": document_response.data,
        "pages": pages_response.data,
        "notes": notes_response.data,
    }

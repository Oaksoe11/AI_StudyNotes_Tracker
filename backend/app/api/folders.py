from fastapi import APIRouter, HTTPException

from app.core.supabase import get_supabase
from app.models.schemas import FolderCreate, FolderUpdate

router = APIRouter()


@router.get("")
def list_folders() -> list[dict]:
    supabase = get_supabase()
    response = supabase.table("folders").select("*").order("created_at", desc=True).execute()
    return response.data


@router.post("")
def create_folder(payload: FolderCreate) -> dict:
    supabase = get_supabase()
    response = supabase.table("folders").insert({"name": payload.name}).execute()
    return response.data[0]


@router.patch("/{folder_id}")
def update_folder(folder_id: str, payload: FolderUpdate) -> dict:
    supabase = get_supabase()
    response = supabase.table("folders").update({"name": payload.name}).eq("id", folder_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Folder not found")

    return response.data[0]


@router.get("/{folder_id}")
def get_folder(folder_id: str) -> dict:
    supabase = get_supabase()
    folder_response = supabase.table("folders").select("*").eq("id", folder_id).single().execute()
    documents_response = supabase.table("documents").select("*").eq("folder_id", folder_id).execute()
    notes_response = supabase.table("notes").select("*").eq("folder_id", folder_id).execute()

    return {
        "folder": folder_response.data,
        "documents": documents_response.data,
        "notes": notes_response.data,
    }


from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.models.schemas import FolderCreate, FolderUpdate

router = APIRouter()


@router.get("")
def list_folders(current_user: dict = Depends(get_current_user)) -> list[dict]:
    supabase = get_supabase()
    response = (
        supabase.table("folders")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@router.post("")
def create_folder(payload: FolderCreate, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    response = supabase.table("folders").insert({"name": payload.name, "user_id": current_user["id"]}).execute()
    return response.data[0]


@router.patch("/{folder_id}")
def update_folder(folder_id: str, payload: FolderUpdate, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    response = (
        supabase.table("folders")
        .update({"name": payload.name})
        .eq("id", folder_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Folder not found")

    return response.data[0]


@router.get("/{folder_id}")
def get_folder(folder_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    folder_response = (
        supabase.table("folders")
        .select("*")
        .eq("id", folder_id)
        .eq("user_id", current_user["id"])
        .single()
        .execute()
    )

    if not folder_response.data:
        raise HTTPException(status_code=404, detail="Folder not found")

    documents_response = (
        supabase.table("documents")
        .select("*")
        .eq("folder_id", folder_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    notes_response = (
        supabase.table("notes")
        .select("*")
        .eq("folder_id", folder_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    return {
        "folder": folder_response.data,
        "documents": documents_response.data,
        "notes": notes_response.data,
    }

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user
from app.core.supabase import get_supabase
from app.models.schemas import FolderCreate, FolderUpdate
from app.services.storage_service import remove_storage_objects

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


@router.delete("/{folder_id}")
def delete_folder(folder_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    documents_response = (
        supabase.table("documents")
        .select("id,storage_path")
        .eq("folder_id", folder_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    documents = documents_response.data or []
    document_ids = [document["id"] for document in documents]
    storage_paths = [document.get("storage_path") for document in documents]

    if document_ids:
        try:
            slides_response = (
                supabase.table("slides")
                .select("image_storage_path")
                .in_("document_id", document_ids)
                .execute()
            )
        except Exception:
            slides_response = (
                supabase.table("document_pages")
                .select("image_storage_path")
                .in_("document_id", document_ids)
                .execute()
            )
        storage_paths.extend(slide.get("image_storage_path") for slide in slides_response.data or [])

    response = (
        supabase.table("folders")
        .delete()
        .eq("id", folder_id)
        .eq("user_id", current_user["id"])
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Folder not found")

    try:
        remove_storage_objects(supabase, [path for path in storage_paths if path])
    except Exception:
        pass

    return {"deleted": True, "folder_id": folder_id}


@router.get("/{folder_id}")
def get_folder(folder_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    supabase = get_supabase()
    try:
        folder_response = (
            supabase.table("folders")
            .select("*")
            .eq("id", folder_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Folder not found") from exc

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

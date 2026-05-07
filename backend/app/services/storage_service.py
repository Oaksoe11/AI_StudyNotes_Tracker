from supabase import Client

from app.core.config import settings


def ensure_storage_bucket(supabase: Client) -> None:
    try:
        supabase.storage.get_bucket(settings.supabase_storage_bucket)
    except Exception:
        supabase.storage.create_bucket(
            settings.supabase_storage_bucket,
            settings.supabase_storage_bucket,
            {"public": True},
        )


def upload_bytes(
    supabase: Client,
    path: str,
    content: bytes,
    content_type: str,
) -> str:
    ensure_storage_bucket(supabase)
    supabase.storage.from_(settings.supabase_storage_bucket).upload(
        path,
        content,
        {"content-type": content_type, "x-upsert": "true"},
    )
    return path


def get_public_url(supabase: Client, path: str) -> str:
    return supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(path)

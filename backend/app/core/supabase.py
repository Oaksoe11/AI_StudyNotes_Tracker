from supabase import Client, create_client

from app.core.config import settings


class SupabaseNotConfiguredError(RuntimeError):
    pass


def get_supabase() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SupabaseNotConfiguredError("Supabase environment variables are not configured.")

    return create_client(settings.supabase_url, settings.supabase_service_role_key)

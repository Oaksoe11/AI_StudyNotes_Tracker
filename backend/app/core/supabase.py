from supabase import Client, create_client

from app.core.config import settings


class SupabaseNotConfiguredError(RuntimeError):
    pass


_supabase_client: Client | None = None


def get_supabase() -> Client:
    global _supabase_client

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SupabaseNotConfiguredError("Supabase environment variables are not configured.")

    if _supabase_client is None:
        # Reuse one backend Supabase client instead of rebuilding it for every request.
        # This removes small repeated setup work from every click/page load.
        _supabase_client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    return _supabase_client

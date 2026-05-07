from fastapi import Header, HTTPException

from app.core.supabase import get_supabase


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Login required.")

    token = authorization.removeprefix("Bearer ").strip()

    supabase = get_supabase()

    try:
        response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid login session.") from exc

    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid login session.")

    user = {
        "id": response.user.id,
        "email": response.user.email,
    }

    try:
        supabase.table("users").upsert(user).execute()
    except Exception:
        # Auth still works if the optional public users table has not been migrated yet.
        pass

    return user

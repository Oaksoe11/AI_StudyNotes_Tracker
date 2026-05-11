from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api import documents, folders, health, notes, quizzes
from app.core.config import settings
from app.core.supabase import SupabaseNotConfiguredError

app = FastAPI(title="AI Study Notes Tracker API")

app.add_middleware(
    CORSMiddleware,
    # CORS is the browser rule that decides which frontend domains can call this API.
    # Locally this is localhost:3000. In production this should include the Vercel URL.
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
# Each router groups related API endpoints so main.py stays small.
# Example: all document upload/extraction routes live in documents.py.
app.include_router(folders.router, prefix="/folders", tags=["folders"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])


@app.exception_handler(SupabaseNotConfiguredError)
async def supabase_not_configured_handler(
    _request: Request,
    exc: SupabaseNotConfiguredError,
) -> JSONResponse:
    # If env vars are missing, return a clear API error instead of a messy crash.
    return JSONResponse(status_code=503, content={"detail": str(exc)})

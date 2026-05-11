from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase project URL, used by the backend to talk to the database/storage.
    supabase_url: str = ""
    # Service role key is secret and powerful. It must stay backend-only.
    supabase_service_role_key: str = ""
    # Storage bucket where PDFs and slide images are saved.
    supabase_storage_bucket: str = "lecture-pdfs"
    # Gemini key is also secret, so only the backend should use it.
    gemini_api_key: str = ""
    # Default Gemini model used for notes and quizzes.
    gemini_model: str = "gemini-2.5-flash"
    # Limit image attachments so Gemini requests do not get too huge.
    gemini_max_images: int = 6
    # MVP limit: process up to 20 PDF pages/slides.
    pdf_max_pages: int = 20
    # Lower scale makes slide image rendering faster and smaller.
    pdf_image_scale: float = 0.9
    # Main frontend URL allowed to call the backend.
    frontend_origin: str = "http://localhost:3000"
    # Optional comma-separated list of extra allowed frontend URLs.
    frontend_origins: str = ""

    # Load backend/.env locally. In production, Render/Railway provide these values.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        # Deployment note for learners:
        # In production, FRONTEND_ORIGINS can hold multiple URLs separated by commas.
        # Example: https://my-app.vercel.app,http://localhost:3000
        origins = [self.frontend_origin]
        if self.frontend_origins:
            origins.extend(origin.strip() for origin in self.frontend_origins.split(","))
        return [origin for origin in origins if origin]


settings = Settings()

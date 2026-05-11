from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "lecture-pdfs"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_max_images: int = 6
    pdf_max_pages: int = 20
    pdf_image_scale: float = 0.9
    frontend_origin: str = "http://localhost:3000"
    frontend_origins: str = ""

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

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Sales Coach API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    openai_api_key: str = ""
    openai_analysis_model: str = "gpt-4o-mini"

    business_id: str = "aa1712fd-ad13-433b-a353-a047dedb74d0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    max_call_seconds: int = 360
    max_call_grace_seconds: int = 30


settings = Settings()

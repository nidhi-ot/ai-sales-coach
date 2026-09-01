from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Sales Coach API"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    frontend_url: str = "http://127.0.0.1:3000"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    allow_open_signup: bool = False

    openai_api_key: str = ""
    openai_analysis_model: str = "gpt-4o-mini"

    ai_profile_update_enabled: bool = False
    openai_profile_model: str = "gpt-5.5"

    business_id: str = "aa1712fd-ad13-433b-a353-a047dedb74d0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    max_call_seconds: int = 600
    max_call_grace_seconds: int = 30
    abandoned_call_seconds: int = 90
    sweeper_interval_seconds: int = 30


settings = Settings()

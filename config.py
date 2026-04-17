from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Facebook Ads
    fb_app_id: str = ""
    fb_app_secret: str = ""
    fb_access_token: str = ""
    fb_ad_account_id: str = ""

    # Google Ads
    google_ads_developer_token: str = ""
    google_ads_client_id: str = ""
    google_ads_client_secret: str = ""
    google_ads_refresh_token: str = ""
    google_ads_login_customer_id: str = ""
    google_ads_customer_id: str = ""

    # QDM
    qdm_base_url: str = ""
    qdm_api_key: str = ""
    qdm_username: str = ""
    qdm_password: str = ""

    # App
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: list[str] = ["*"]


settings = Settings()

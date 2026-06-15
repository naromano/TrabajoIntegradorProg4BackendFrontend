from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MP_ACCESS_TOKEN: str = ""
    MP_PUBLIC_KEY: str = ""
    MP_WEBHOOK_SECRET: str = ""
    MP_WEBHOOK_URL: str = ""
    NGROK_URL: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    WS_URL: str = "ws://localhost:8000/api/v1/pedidos/ws"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
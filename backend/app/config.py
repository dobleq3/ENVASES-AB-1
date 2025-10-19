from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    PORT: int = 5000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

print("Mongo URI:", settings.MONGO_URI)


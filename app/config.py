import os
from pathlib import Path
from dotenv import load_dotenv

# App directory ka path nikal rahe hain
BASE_DIR = Path(__file__).resolve().parent

# Forcefully app folder ke andar wali .env load karega
load_dotenv(dotenv_path=BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Harvester Smart Khata App"
    PROJECT_VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./harvester.db")

settings = Settings()
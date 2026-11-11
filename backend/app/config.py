import os
from pathlib import Path
from dotenv import load_dotenv

# Find .env in backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "LeadIQ – AI-Powered Lead Enrichment System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DB_PATH = BASE_DIR / "leadiq.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH.as_posix()}")
    
    # AI - Groq (Optional)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # CORS
    cors_str: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
    CORS_ORIGINS: list = [origin.strip() for origin in cors_str.split(",") if origin.strip()]

settings = Settings()

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.services.ai_service import ai_service

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdateRequest(BaseModel):
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None

class GroqTestRequest(BaseModel):
    sample_company: Optional[str] = "Acme Cloud"
    sample_domain: Optional[str] = "acmecloud.io"

@router.get("")
def get_settings():
    has_key = bool(settings.GROQ_API_KEY and len(settings.GROQ_API_KEY.strip()) > 5)
    masked_key = ""
    if has_key:
        k = settings.GROQ_API_KEY.strip()
        masked_key = f"{k[:4]}...{k[-4:]}" if len(k) > 8 else "***"

    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "SQLite (zero-cost local storage)",
        "groq_configured": has_key,
        "groq_masked_key": masked_key,
        "groq_model": settings.GROQ_MODEL,
        "available_models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it"
        ],
        "ai_mode": "Groq Cloud API" if has_key else "Rule-based Classification Fallback (Zero-Cost)"
    }

@router.post("/update")
def update_settings(req: SettingsUpdateRequest):
    if req.groq_api_key is not None:
        settings.GROQ_API_KEY = req.groq_api_key.strip()
    if req.groq_model is not None and req.groq_model.strip():
        settings.GROQ_MODEL = req.groq_model.strip()
    
    return get_settings()

@router.post("/test-groq")
def test_groq_connection(req: GroqTestRequest):
    result = ai_service.classify_company(
        company_name=req.sample_company,
        company_domain=req.sample_domain,
        job_title="Software Architect",
        company_description="Cloud infrastructure and observability platform"
    )
    return {
        "status": "success",
        "method_used": result.get("method"),
        "classification": result
    }

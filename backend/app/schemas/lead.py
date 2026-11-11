from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LeadBase(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    website: Optional[str] = None
    company_domain: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    company_description: Optional[str] = None
    location: Optional[str] = None
    lead_source: Optional[str] = "manual"

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    website: Optional[str] = None
    company_domain: Optional[str] = None
    job_title: Optional[str] = None
    industry: Optional[str] = None
    company_description: Optional[str] = None
    location: Optional[str] = None
    lead_source: Optional[str] = None
    email_status: Optional[str] = None
    email_reason: Optional[str] = None
    phone_status: Optional[str] = None
    phone_reason: Optional[str] = None
    duplicate_status: Optional[str] = None
    duplicate_reason: Optional[str] = None
    duplicate_of_id: Optional[int] = None
    enrichment_status: Optional[str] = None
    enrichment_method: Optional[str] = None
    enrichment_source: Optional[str] = None
    business_category: Optional[str] = None
    business_model: Optional[str] = None
    classification_confidence: Optional[str] = None
    classification_reason: Optional[str] = None
    ai_summary: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    email_status: str
    email_reason: Optional[str] = None
    phone_status: str
    phone_reason: Optional[str] = None
    duplicate_status: str
    duplicate_reason: Optional[str] = None
    duplicate_of_id: Optional[int] = None
    enrichment_status: str
    enrichment_method: Optional[str] = None
    enrichment_source: Optional[str] = None
    business_category: Optional[str] = None
    business_model: Optional[str] = None
    classification_confidence: Optional[str] = None
    classification_reason: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeadListResponse(BaseModel):
    items: List[LeadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class LeadBatchActionRequest(BaseModel):
    lead_ids: List[int]

class LeadBatchActionResponse(BaseModel):
    total_requested: int
    successful: int
    failed: int
    errors: List[str] = []

class DuplicateCheckRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    exclude_id: Optional[int] = None

class DuplicateCheckResponse(BaseModel):
    status: str  # "unique", "possible_duplicate", "confirmed_duplicate"
    reason: Optional[str] = None
    matching_lead_id: Optional[int] = None
    matching_lead: Optional[LeadResponse] = None

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(100), nullable=True, index=True)
    company_name = Column(String(255), nullable=True, index=True)
    website = Column(String(255), nullable=True)
    company_domain = Column(String(255), nullable=True, index=True)
    job_title = Column(String(255), nullable=True)
    industry = Column(String(255), nullable=True)
    company_description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    lead_source = Column(String(100), default="manual", nullable=False)
    
    # Validation statuses
    email_status = Column(String(50), default="pending", nullable=False)
    email_reason = Column(Text, nullable=True)
    phone_status = Column(String(50), default="pending", nullable=False)
    phone_reason = Column(Text, nullable=True)
    
    # Duplicate statuses
    duplicate_status = Column(String(50), default="unique", nullable=False)
    duplicate_reason = Column(Text, nullable=True)
    duplicate_of_id = Column(Integer, nullable=True)
    
    # Enrichment & AI statuses
    enrichment_status = Column(String(50), default="pending", nullable=False)
    enrichment_method = Column(String(50), nullable=True)
    enrichment_source = Column(String(100), nullable=True)
    business_category = Column(String(255), nullable=True)
    business_model = Column(String(255), nullable=True)
    classification_confidence = Column(String(50), nullable=True)
    classification_reason = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "company_name": self.company_name,
            "website": self.website,
            "company_domain": self.company_domain,
            "job_title": self.job_title,
            "industry": self.industry,
            "company_description": self.company_description,
            "location": self.location,
            "lead_source": self.lead_source,
            "email_status": self.email_status,
            "email_reason": self.email_reason,
            "phone_status": self.phone_status,
            "phone_reason": self.phone_reason,
            "duplicate_status": self.duplicate_status,
            "duplicate_reason": self.duplicate_reason,
            "duplicate_of_id": self.duplicate_of_id,
            "enrichment_status": self.enrichment_status,
            "enrichment_method": self.enrichment_method,
            "enrichment_source": self.enrichment_source,
            "business_category": self.business_category,
            "business_model": self.business_model,
            "classification_confidence": self.classification_confidence,
            "classification_reason": self.classification_reason,
            "ai_summary": self.ai_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

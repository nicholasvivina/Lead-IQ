from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.lead import Lead

class DuplicateService:
    @staticmethod
    def check_duplicate(
        db: Session,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        full_name: Optional[str] = None,
        company_name: Optional[str] = None,
        company_domain: Optional[str] = None,
        exclude_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Detects duplicates against the SQLite database:
        1. Exact duplicate email (case-insensitive) -> confirmed_duplicate
        2. Duplicate phone (exact or normalized) -> confirmed_duplicate
        3. Matching contact name and company -> possible_duplicate
        4. Matching company name and email domain -> possible_duplicate
        """
        # Clean inputs
        clean_email = email.strip().lower() if email and email.strip() else None
        clean_phone = phone.strip() if phone and phone.strip() else None
        clean_name = full_name.strip().lower() if full_name and full_name.strip() else None
        clean_company = company_name.strip().lower() if company_name and company_name.strip() else None
        clean_domain = company_domain.strip().lower() if company_domain and company_domain.strip() else None
        
        # If domain not provided, extract from email if corporate domain
        if not clean_domain and clean_email and "@" in clean_email:
            em_domain = clean_email.split("@")[-1]
            if em_domain not in ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"]:
                clean_domain = em_domain

        query = db.query(Lead)
        if exclude_id:
            query = query.filter(Lead.id != exclude_id)

        # 1. Exact email match (case-insensitive) -> confirmed_duplicate
        if clean_email:
            match = query.filter(func.lower(Lead.email) == clean_email).first()
            if match:
                return {
                    "status": "confirmed_duplicate",
                    "reason": f"Exact email match found with Lead #{match.id} ({match.full_name or 'Unnamed'} - {match.email})",
                    "matching_lead_id": match.id,
                    "match_field": "email"
                }

        # 2. Normalized phone match -> confirmed_duplicate
        if clean_phone and len(clean_phone) >= 7:
            # Strip non-digits except +
            cleaned_digits = "".join(c for c in clean_phone if c.isdigit() or c == "+")
            match = query.filter(Lead.phone.isnot(None)).filter(
                func.replace(func.replace(func.replace(Lead.phone, " ", ""), "-", ""), "(", "") == cleaned_digits
            ).first()
            if match:
                return {
                    "status": "confirmed_duplicate",
                    "reason": f"Exact phone number match found with Lead #{match.id} ({match.full_name or 'Unnamed'} - {match.phone})",
                    "matching_lead_id": match.id,
                    "match_field": "phone"
                }

        # 3. Contact name and company name match -> possible_duplicate
        if clean_name and clean_company:
            match = query.filter(
                func.lower(Lead.full_name) == clean_name,
                func.lower(Lead.company_name) == clean_company
            ).first()
            if match:
                return {
                    "status": "possible_duplicate",
                    "reason": f"Same contact name ('{clean_name.title()}') and company ('{clean_company.title()}') as Lead #{match.id}.",
                    "matching_lead_id": match.id,
                    "match_field": "name_and_company"
                }

        # 4. Company name and company/email domain match -> possible_duplicate
        if clean_domain and clean_company:
            match = query.filter(
                func.lower(Lead.company_name) == clean_company,
                func.lower(Lead.company_domain) == clean_domain
            ).first()
            if match:
                return {
                    "status": "possible_duplicate",
                    "reason": f"Matching company ('{clean_company.title()}') and domain ('{clean_domain}') with Lead #{match.id}.",
                    "matching_lead_id": match.id,
                    "match_field": "company_and_domain"
                }

        return {
            "status": "unique",
            "reason": "No duplicate records detected in system.",
            "matching_lead_id": None,
            "match_field": None
        }

duplicate_service = DuplicateService()

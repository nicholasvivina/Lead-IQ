"""
Seed script to import sample_leads.csv into leadiq.db
"""
import sys
from pathlib import Path

# Add backend to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root / "backend"))

from app.database import engine, Base, SessionLocal
from app.models.lead import Lead
from app.models.import_history import ImportHistory
from app.utils.csv_helper import read_csv_bytes, suggest_column_mapping
from app.services.email_validator_service import email_validator_service
from app.services.phone_validator_service import phone_validator_service
from app.services.duplicate_service import duplicate_service
from app.services.enrichment_service import enrichment_service
from app.services.ai_service import ai_service
import json

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    csv_path = project_root / "sample_data" / "sample_leads.csv"
    if not csv_path.exists():
        print(f"Sample CSV not found at {csv_path}")
        return

    with open(csv_path, "rb") as f:
        content = f.read()

    headers, rows = read_csv_bytes(content)
    mapping = suggest_column_mapping(headers)
    print(f"Found {len(rows)} sample records. Column mapping: {mapping}")

    field_to_header = {v: k for k, v in mapping.items() if v}

    imported = 0
    duplicates = 0
    invalid = 0

    for row in rows:
        email = row.get(field_to_header.get("email", ""), "").strip() or None
        phone = row.get(field_to_header.get("phone", ""), "").strip() or None
        full_name = row.get(field_to_header.get("full_name", ""), "").strip() or None
        company_name = row.get(field_to_header.get("company_name", ""), "").strip() or None
        website = row.get(field_to_header.get("website", ""), "").strip() or None
        job_title = row.get(field_to_header.get("job_title", ""), "").strip() or None
        industry = row.get(field_to_header.get("industry", ""), "").strip() or None
        location = row.get(field_to_header.get("location", ""), "").strip() or None
        desc = row.get(field_to_header.get("company_description", ""), "").strip() or None

        lead = Lead(
            full_name=full_name,
            email=email,
            phone=phone,
            company_name=company_name,
            website=website,
            job_title=job_title,
            industry=industry,
            location=location,
            company_description=desc,
            lead_source="sample_import"
        )

        # Domain extraction
        domain = enrichment_service.normalize_domain(website)
        if not domain and email and "@" in email:
            domain = enrichment_service.normalize_domain(email.split("@")[-1])
        lead.company_domain = domain

        # Validation
        if email:
            e_res = email_validator_service.validate(email)
            lead.email = e_res.get("normalized_email") or email
            lead.email_status = e_res["status"]
            lead.email_reason = e_res["reason"]
            if e_res["status"] == "invalid":
                invalid += 1
        else:
            lead.email_status = "invalid"
            lead.email_reason = "Missing email address."
            invalid += 1

        if phone:
            p_res = phone_validator_service.validate(phone)
            if p_res["status"] == "valid":
                lead.phone = p_res["normalized_phone"]
            lead.phone_status = p_res["status"]
            lead.phone_reason = p_res["reason"]
        else:
            lead.phone_status = "unverified"
            lead.phone_reason = "No phone provided."

        # Duplicate check against existing db
        dup_res = duplicate_service.check_duplicate(
            db=db,
            email=lead.email,
            phone=lead.phone,
            full_name=lead.full_name,
            company_name=lead.company_name,
            company_domain=lead.company_domain
        )
        lead.duplicate_status = dup_res["status"]
        lead.duplicate_reason = dup_res["reason"]
        lead.duplicate_of_id = dup_res["matching_lead_id"]

        if dup_res["status"] == "confirmed_duplicate":
            duplicates += 1

        # Enrich company & classification
        en_res = enrichment_service.enrich_company_details(
            company_name=lead.company_name,
            website=lead.website,
            email=lead.email,
            existing_description=lead.company_description,
            location=lead.location,
            fetch_online_metadata=False
        )
        lead.company_domain = en_res["company_domain"] or lead.company_domain
        lead.company_description = en_res["company_description"] or lead.company_description
        lead.enrichment_source = en_res["data_source"]

        ai_res = ai_service.classify_company(
            company_name=lead.company_name,
            company_domain=lead.company_domain,
            job_title=lead.job_title,
            company_description=lead.company_description,
            industry_hint=lead.industry,
            location=lead.location
        )
        lead.industry = ai_res.get("industry") or lead.industry
        lead.business_category = ai_res.get("business_category")
        lead.business_model = ai_res.get("business_model")
        lead.classification_confidence = ai_res.get("confidence")
        lead.classification_reason = ai_res.get("reason")
        lead.ai_summary = ai_res.get("company_summary")
        lead.enrichment_method = ai_res.get("method")
        lead.enrichment_status = "completed"

        db.add(lead)
        db.flush()
        imported += 1

    # Record history
    hist = ImportHistory(
        filename="sample_leads.csv",
        total_records=len(rows),
        successful_records=imported,
        duplicate_records=duplicates,
        invalid_records=invalid,
        rejected_records=0,
        status="completed"
    )
    db.add(hist)
    db.commit()
    db.close()
    print(f"Seeding complete! Successfully imported {imported} leads ({duplicates} duplicates, {invalid} invalid).")

if __name__ == "__main__":
    seed()

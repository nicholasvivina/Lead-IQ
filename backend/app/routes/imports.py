import io
import csv
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.lead import Lead
from app.models.import_history import ImportHistory
from app.schemas.import_history import (
    ImportHistoryResponse,
    CSVPreviewResponse,
    CSVImportRequest,
    CSVImportResultResponse
)
from app.utils.csv_helper import (
    read_csv_bytes,
    suggest_column_mapping,
    sanitize_csv_cell
)
from app.services.email_validator_service import email_validator_service
from app.services.phone_validator_service import phone_validator_service
from app.services.duplicate_service import duplicate_service
from app.services.enrichment_service import enrichment_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/imports", tags=["CSV Imports"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@router.get("", response_model=List[ImportHistoryResponse])
def get_import_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    history = db.query(ImportHistory).order_by(desc(ImportHistory.created_at)).limit(limit).all()
    return history

@router.post("/preview", response_model=CSVPreviewResponse)
def preview_csv(file: UploadFile = File(...)):
    """
    Step 1-3: Upload CSV file, inspect headers, preview first 10 rows,
    and generate smart column mapping suggestions.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit.")

    try:
        headers, rows = read_csv_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    suggested = suggest_column_mapping(headers)
    preview_slice = rows[:10]

    return CSVPreviewResponse(
        filename=file.filename,
        headers=headers,
        suggested_mapping=suggested,
        preview_rows=preview_slice,
        total_rows=len(rows)
    )

@router.post("/process", response_model=CSVImportResultResponse)
def process_csv_import(
    req: CSVImportRequest,
    db: Session = Depends(get_db)
):
    """
    Step 4-7: Confirms mapped import, processes each record, runs validation,
    flags duplicates, records import history, and tracks rejected rows.
    """
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided for import.")

    total_records = len(req.rows)
    successful_records = 0
    duplicate_records = 0
    invalid_records = 0
    rejected_records = 0
    rejected_rows = []

    # Invert mapping: target_field -> csv_header
    field_to_header = {}
    for header, target in req.column_mapping.items():
        if target:
            field_to_header[target] = header

    for idx, row in enumerate(req.rows, start=1):
        try:
            full_name = row.get(field_to_header.get("full_name", ""), "").strip() or None
            email = row.get(field_to_header.get("email", ""), "").strip() or None
            phone = row.get(field_to_header.get("phone", ""), "").strip() or None
            company_name = row.get(field_to_header.get("company_name", ""), "").strip() or None
            website = row.get(field_to_header.get("website", ""), "").strip() or None
            job_title = row.get(field_to_header.get("job_title", ""), "").strip() or None
            industry = row.get(field_to_header.get("industry", ""), "").strip() or None
            location = row.get(field_to_header.get("location", ""), "").strip() or None
            lead_source = row.get(field_to_header.get("lead_source", ""), "").strip() or "csv_import"
            company_description = row.get(field_to_header.get("company_description", ""), "").strip() or None

            # Basic sanity check: lead must have at least email, name, or company
            if not email and not full_name and not company_name:
                rejected_records += 1
                row_copy = dict(row)
                row_copy["_rejection_reason"] = "Row contains neither email, contact name, nor company name."
                row_copy["_row_number"] = idx
                rejected_rows.append(row_copy)
                continue

            lead = Lead(
                full_name=full_name,
                email=email,
                phone=phone,
                company_name=company_name,
                website=website,
                job_title=job_title,
                industry=industry,
                location=location,
                lead_source=lead_source,
                company_description=company_description
            )

            # Domain extraction
            domain = enrichment_service.normalize_domain(website)
            if not domain and email and "@" in email:
                domain = enrichment_service.normalize_domain(email.split("@")[-1])
            lead.company_domain = domain

            # Validation
            if req.auto_validate:
                if email:
                    e_res = email_validator_service.validate(email)
                    lead.email = e_res.get("normalized_email") or email
                    lead.email_status = e_res["status"]
                    lead.email_reason = e_res["reason"]
                    if e_res["status"] == "invalid":
                        invalid_records += 1
                else:
                    lead.email_status = "invalid"
                    lead.email_reason = "Missing email address."
                    invalid_records += 1

                if phone:
                    p_res = phone_validator_service.validate(phone)
                    if p_res["status"] == "valid":
                        lead.phone = p_res["normalized_phone"]
                    lead.phone_status = p_res["status"]
                    lead.phone_reason = p_res["reason"]
                else:
                    lead.phone_status = "unverified"
                    lead.phone_reason = "No phone number provided."

                # Duplicate detection
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
                    duplicate_records += 1
                    if req.skip_duplicates:
                        # Skip insertion if user opted to skip duplicates
                        rejected_records += 1
                        row_copy = dict(row)
                        row_copy["_rejection_reason"] = f"Skipped: {dup_res['reason']}"
                        row_copy["_row_number"] = idx
                        rejected_rows.append(row_copy)
                        continue

            # Optional auto-enrichment during import
            if req.auto_enrich:
                en_res = enrichment_service.enrich_company_details(
                    company_name=lead.company_name,
                    website=lead.website,
                    email=lead.email,
                    existing_description=lead.company_description,
                    location=lead.location
                )
                lead.company_name = en_res["company_name"] or lead.company_name
                lead.company_domain = en_res["company_domain"] or lead.company_domain
                lead.website = en_res["website"] or lead.website
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
            db.flush()  # assign ID and test constraints
            successful_records += 1

        except Exception as e:
            db.rollback()
            rejected_records += 1
            row_copy = dict(row)
            row_copy["_rejection_reason"] = f"Database insertion error: {str(e)}"
            row_copy["_row_number"] = idx
            rejected_rows.append(row_copy)

    # Record import history
    history = ImportHistory(
        filename=req.filename,
        total_records=total_records,
        successful_records=successful_records,
        duplicate_records=duplicate_records,
        invalid_records=invalid_records,
        rejected_records=rejected_records,
        status="completed",
        rejected_data_json=json.dumps(rejected_rows) if rejected_rows else None
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return CSVImportResultResponse(
        import_history_id=history.id,
        filename=req.filename,
        total_records=total_records,
        successful_records=successful_records,
        duplicate_records=duplicate_records,
        invalid_records=invalid_records,
        rejected_records=rejected_records,
        rejected_rows=rejected_rows
    )

@router.get("/{history_id}/rejected")
def download_rejected_records(
    history_id: int,
    db: Session = Depends(get_db)
):
    """
    Downloads rejected records for a given import as a CSV file.
    """
    history = db.query(ImportHistory).filter(ImportHistory.id == history_id).first()
    if not history or not history.rejected_data_json:
        raise HTTPException(status_code=404, detail="No rejected records found for this import.")

    try:
        rejected_list = json.loads(history.rejected_data_json)
    except Exception:
        raise HTTPException(status_code=500, detail="Corrupted rejection records data.")

    if not rejected_list:
        raise HTTPException(status_code=404, detail="No rejected records in this import.")

    output = io.StringIO()
    # Collect all field names
    all_keys = set()
    for item in rejected_list:
        all_keys.update(item.keys())
    
    headers = ["_row_number", "_rejection_reason"] + [k for k in sorted(all_keys) if k not in ["_row_number", "_rejection_reason"]]
    writer = csv.writer(output)
    writer.writerow(headers)

    for item in rejected_list:
        row_vals = [sanitize_csv_cell(item.get(h, "")) for h in headers]
        writer.writerow(row_vals)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=rejected_{history.filename}"}
    )

import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from app.database import get_db
from app.models.lead import Lead
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadListResponse,
    LeadBatchActionRequest,
    LeadBatchActionResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse
)
from app.services.email_validator_service import email_validator_service
from app.services.phone_validator_service import phone_validator_service
from app.services.duplicate_service import duplicate_service
from app.services.enrichment_service import enrichment_service
from app.services.ai_service import ai_service
from app.utils.csv_helper import sanitize_csv_cell

router = APIRouter(prefix="/leads", tags=["Leads"])

@router.get("", response_model=LeadListResponse)
def get_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    email_status: Optional[str] = Query(None),
    phone_status: Optional[str] = Query(None),
    duplicate_status: Optional[str] = Query(None),
    enrichment_status: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Lead)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Lead.full_name).like(term),
                func.lower(Lead.email).like(term),
                func.lower(Lead.company_name).like(term),
                func.lower(Lead.job_title).like(term),
                func.lower(Lead.location).like(term),
                func.lower(Lead.company_domain).like(term)
            )
        )

    # Status filters
    if email_status:
        query = query.filter(Lead.email_status == email_status)
    if phone_status:
        query = query.filter(Lead.phone_status == phone_status)
    if duplicate_status:
        query = query.filter(Lead.duplicate_status == duplicate_status)
    if enrichment_status:
        query = query.filter(Lead.enrichment_status == enrichment_status)
    if industry:
        query = query.filter(func.lower(Lead.industry) == industry.lower())

    # Sorting
    sort_column = getattr(Lead, sort_by, Lead.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return LeadListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    auto_validate: bool = Query(True),
    auto_enrich: bool = Query(False),
    db: Session = Depends(get_db)
):
    # Prepare basic lead instance
    lead_data = lead_in.model_dump()
    lead = Lead(**lead_data)

    # 1. Normalize company domain if website or email provided
    if not lead.company_domain:
        domain = enrichment_service.normalize_domain(lead.website)
        if not domain and lead.email and "@" in lead.email:
            domain = enrichment_service.normalize_domain(lead.email.split("@")[-1])
        lead.company_domain = domain

    # 2. Validation
    if auto_validate:
        if lead.email:
            e_res = email_validator_service.validate(lead.email)
            lead.email = e_res.get("normalized_email") or lead.email
            lead.email_status = e_res["status"]
            lead.email_reason = e_res["reason"]
        
        if lead.phone:
            p_res = phone_validator_service.validate(lead.phone)
            if p_res["status"] == "valid":
                lead.phone = p_res["normalized_phone"]
            lead.phone_status = p_res["status"]
            lead.phone_reason = p_res["reason"]

        # Duplicate check
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

    # 3. Optional auto-enrich
    if auto_enrich:
        enrich_res = enrichment_service.enrich_company_details(
            company_name=lead.company_name,
            website=lead.website,
            email=lead.email,
            existing_description=lead.company_description,
            location=lead.location
        )
        lead.company_name = enrich_res["company_name"] or lead.company_name
        lead.company_domain = enrich_res["company_domain"] or lead.company_domain
        lead.website = enrich_res["website"] or lead.website
        lead.company_description = enrich_res["company_description"] or lead.company_description
        lead.enrichment_source = enrich_res["data_source"]

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
    db.commit()
    db.refresh(lead)
    return lead

@router.get("/export")
def export_leads(
    search: Optional[str] = Query(None),
    email_status: Optional[str] = Query(None),
    phone_status: Optional[str] = Query(None),
    duplicate_status: Optional[str] = Query(None),
    enrichment_status: Optional[str] = Query(None),
    lead_ids: Optional[str] = Query(None),  # Comma separated IDs
    db: Session = Depends(get_db)
):
    """
    Exports leads as CSV with formula injection protection.
    """
    query = db.query(Lead)

    if lead_ids:
        ids = [int(i.strip()) for i in lead_ids.split(",") if i.strip().isdigit()]
        if ids:
            query = query.filter(Lead.id.in_(ids))
    else:
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(Lead.full_name).like(term),
                    func.lower(Lead.email).like(term),
                    func.lower(Lead.company_name).like(term),
                    func.lower(Lead.job_title).like(term)
                )
            )
        if email_status:
            query = query.filter(Lead.email_status == email_status)
        if phone_status:
            query = query.filter(Lead.phone_status == phone_status)
        if duplicate_status:
            query = query.filter(Lead.duplicate_status == duplicate_status)
        if enrichment_status:
            query = query.filter(Lead.enrichment_status == enrichment_status)

    leads = query.order_by(desc(Lead.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)

    headers = [
        "ID", "Full Name", "Email", "Phone", "Company Name", "Website", "Domain",
        "Job Title", "Industry", "Business Category", "Business Model", "Location",
        "Email Status", "Email Reason", "Phone Status", "Phone Reason",
        "Duplicate Status", "Duplicate Reason", "Enrichment Status", "Enrichment Method",
        "Confidence", "AI Summary", "Lead Source", "Created At"
    ]
    writer.writerow(headers)

    for lead in leads:
        writer.writerow([
            sanitize_csv_cell(lead.id),
            sanitize_csv_cell(lead.full_name),
            sanitize_csv_cell(lead.email),
            sanitize_csv_cell(lead.phone),
            sanitize_csv_cell(lead.company_name),
            sanitize_csv_cell(lead.website),
            sanitize_csv_cell(lead.company_domain),
            sanitize_csv_cell(lead.job_title),
            sanitize_csv_cell(lead.industry),
            sanitize_csv_cell(lead.business_category),
            sanitize_csv_cell(lead.business_model),
            sanitize_csv_cell(lead.location),
            sanitize_csv_cell(lead.email_status),
            sanitize_csv_cell(lead.email_reason),
            sanitize_csv_cell(lead.phone_status),
            sanitize_csv_cell(lead.phone_reason),
            sanitize_csv_cell(lead.duplicate_status),
            sanitize_csv_cell(lead.duplicate_reason),
            sanitize_csv_cell(lead.enrichment_status),
            sanitize_csv_cell(lead.enrichment_method),
            sanitize_csv_cell(lead.classification_confidence),
            sanitize_csv_cell(lead.ai_summary),
            sanitize_csv_cell(lead.lead_source),
            sanitize_csv_cell(lead.created_at.strftime("%Y-%m-%d %H:%M:%S") if lead.created_at else "")
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_export.csv"}
    )

@router.post("/check-duplicates", response_model=DuplicateCheckResponse)
def check_duplicates_endpoint(
    req: DuplicateCheckRequest,
    db: Session = Depends(get_db)
):
    result = duplicate_service.check_duplicate(
        db=db,
        email=req.email,
        phone=req.phone,
        full_name=req.full_name,
        company_name=req.company_name,
        exclude_id=req.exclude_id
    )

    matching_lead = None
    if result["matching_lead_id"]:
        matching_lead = db.query(Lead).filter(Lead.id == result["matching_lead_id"]).first()

    return DuplicateCheckResponse(
        status=result["status"],
        reason=result["reason"],
        matching_lead_id=result["matching_lead_id"],
        matching_lead=matching_lead
    )

@router.post("/batch-enrich", response_model=LeadBatchActionResponse)
def batch_enrich(
    req: LeadBatchActionRequest,
    db: Session = Depends(get_db)
):
    successful = 0
    failed = 0
    errors = []

    leads = db.query(Lead).filter(Lead.id.in_(req.lead_ids)).all()
    for lead in leads:
        try:
            # 1. Company enrichment
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

            # 2. AI classification
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

            successful += 1
        except Exception as e:
            failed += 1
            errors.append(f"Lead #{lead.id}: {str(e)}")
            lead.enrichment_status = "failed"

    db.commit()
    return LeadBatchActionResponse(
        total_requested=len(req.lead_ids),
        successful=successful,
        failed=failed,
        errors=errors
    )

@router.post("/batch-delete", response_model=LeadBatchActionResponse)
def batch_delete(
    req: LeadBatchActionRequest,
    db: Session = Depends(get_db)
):
    try:
        deleted = db.query(Lead).filter(Lead.id.in_(req.lead_ids)).delete(synchronize_session=False)
        db.commit()
        return LeadBatchActionResponse(
            total_requested=len(req.lead_ids),
            successful=deleted,
            failed=0,
            errors=[]
        )
    except Exception as e:
        db.rollback()
        return LeadBatchActionResponse(
            total_requested=len(req.lead_ids),
            successful=0,
            failed=len(req.lead_ids),
            errors=[str(e)]
        )

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, lead_in: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = lead_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(lead, field, val)

    # Re-normalize domain if website was updated
    if "website" in update_data and update_data["website"]:
        domain = enrichment_service.normalize_domain(update_data["website"])
        if domain:
            lead.company_domain = domain

    db.commit()
    db.refresh(lead)
    return lead

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return None

@router.post("/{lead_id}/validate", response_model=LeadResponse)
def validate_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Email validation
    if lead.email:
        e_res = email_validator_service.validate(lead.email)
        lead.email = e_res.get("normalized_email") or lead.email
        lead.email_status = e_res["status"]
        lead.email_reason = e_res["reason"]
    else:
        lead.email_status = "invalid"
        lead.email_reason = "No email address provided."

    # Phone validation
    if lead.phone:
        p_res = phone_validator_service.validate(lead.phone)
        if p_res["status"] == "valid":
            lead.phone = p_res["normalized_phone"]
        lead.phone_status = p_res["status"]
        lead.phone_reason = p_res["reason"]
    else:
        lead.phone_status = "unverified"
        lead.phone_reason = "No phone number provided."

    # Duplicate check
    dup_res = duplicate_service.check_duplicate(
        db=db,
        email=lead.email,
        phone=lead.phone,
        full_name=lead.full_name,
        company_name=lead.company_name,
        company_domain=lead.company_domain,
        exclude_id=lead.id
    )
    lead.duplicate_status = dup_res["status"]
    lead.duplicate_reason = dup_res["reason"]
    lead.duplicate_of_id = dup_res["matching_lead_id"]

    db.commit()
    db.refresh(lead)
    return lead

@router.post("/{lead_id}/enrich", response_model=LeadResponse)
def enrich_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.enrichment_status = "processing"
    db.commit()

    try:
        # Step 1: Company enrichment & domain extraction
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

        # Step 2: AI Classification
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

    except Exception as e:
        lead.enrichment_status = "failed"
        lead.classification_reason = f"Enrichment failure: {str(e)}"

    db.commit()
    db.refresh(lead)
    return lead

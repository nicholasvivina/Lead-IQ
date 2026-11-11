from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models.lead import Lead
from app.models.import_history import ImportHistory
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStats,
    DashboardCharts,
    DistributionItem,
    RecentImportItem
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardResponse)
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    Computes all real statistics, charts, and activity data from the database.
    Strictly zero hardcoding.
    """
    total_leads = db.query(Lead).count()

    # Valid leads: domain_valid or syntax_valid or valid
    valid_leads = db.query(Lead).filter(
        Lead.email_status.in_(["valid", "domain_valid", "syntax_valid"])
    ).count()

    invalid_leads = db.query(Lead).filter(
        Lead.email_status == "invalid"
    ).count()

    duplicate_leads = db.query(Lead).filter(
        Lead.duplicate_status.in_(["confirmed_duplicate", "possible_duplicate"])
    ).count()

    enriched_leads = db.query(Lead).filter(
        Lead.enrichment_status == "completed"
    ).count()

    pending_enrichment = db.query(Lead).filter(
        Lead.enrichment_status.in_(["pending", "processing", "needs_review"])
    ).count()

    stats = DashboardStats(
        total_leads=total_leads,
        valid_leads=valid_leads,
        invalid_leads=invalid_leads,
        duplicate_leads=duplicate_leads,
        enriched_leads=enriched_leads,
        pending_enrichment=pending_enrichment
    )

    # 1. Validation status distribution chart
    status_counts = db.query(
        Lead.email_status,
        func.count(Lead.id)
    ).group_by(Lead.email_status).all()

    color_map = {
        "valid": "#10B981",         # Green
        "domain_valid": "#059669",  # Dark green
        "syntax_valid": "#34D399",  # Light green
        "invalid": "#EF4444",       # Red
        "unverified": "#F59E0B",    # Amber
        "pending": "#9CA3AF"        # Gray
    }

    validation_dist = []
    for st, count in status_counts:
        display_name = (st or "unverified").replace("_", " ").title()
        validation_dist.append(
            DistributionItem(
                name=display_name,
                value=count,
                color=color_map.get(st or "unverified", "#6B7280")
            )
        )

    # 2. Industry distribution chart (Top 5 + Other)
    ind_counts = db.query(
        Lead.industry,
        func.count(Lead.id)
    ).filter(Lead.industry.isnot(None), Lead.industry != "").group_by(Lead.industry).order_by(desc(func.count(Lead.id))).all()

    industry_dist = []
    top_industries = ind_counts[:5]
    other_count = sum(c for _, c in ind_counts[5:])

    palette = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#6B7280"]
    for idx, (ind_name, count) in enumerate(top_industries):
        industry_dist.append(
            DistributionItem(
                name=ind_name,
                value=count,
                color=palette[idx % len(palette)]
            )
        )
    if other_count > 0:
        industry_dist.append(
            DistributionItem(
                name="Other Sectors",
                value=other_count,
                color="#94A3B8"
            )
        )

    # 3. Recent lead imports trend
    recent_trend_rows = db.query(
        func.date(Lead.created_at).label("day"),
        func.count(Lead.id)
    ).group_by(func.date(Lead.created_at)).order_by(desc("day")).limit(7).all()

    recent_imports_trend = [
        RecentImportItem(date=str(row[0]), count=row[1])
        for row in reversed(recent_trend_rows)
    ]

    # Recent activity
    recent_leads = db.query(Lead).order_by(desc(Lead.created_at)).limit(5).all()
    recent_enriched = db.query(Lead).filter(
        Lead.enrichment_status == "completed"
    ).order_by(desc(Lead.updated_at)).limit(5).all()
    recent_imports = db.query(ImportHistory).order_by(desc(ImportHistory.created_at)).limit(5).all()

    return DashboardResponse(
        stats=stats,
        charts=DashboardCharts(
            validation_status=validation_dist,
            industry_distribution=industry_dist,
            recent_imports_trend=recent_imports_trend
        ),
        recent_leads=recent_leads,
        recent_enriched=recent_enriched,
        recent_imports=recent_imports
    )

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.lead import LeadResponse
from app.schemas.import_history import ImportHistoryResponse

class DashboardStats(BaseModel):
    total_leads: int
    valid_leads: int
    invalid_leads: int
    duplicate_leads: int
    enriched_leads: int
    pending_enrichment: int

class DistributionItem(BaseModel):
    name: str
    value: int
    color: Optional[str] = None

class RecentImportItem(BaseModel):
    date: str
    count: int

class DashboardCharts(BaseModel):
    validation_status: List[DistributionItem]
    industry_distribution: List[DistributionItem]
    recent_imports_trend: List[RecentImportItem]

class DashboardResponse(BaseModel):
    stats: DashboardStats
    charts: DashboardCharts
    recent_leads: List[LeadResponse]
    recent_enriched: List[LeadResponse]
    recent_imports: List[ImportHistoryResponse]

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ImportHistoryResponse(BaseModel):
    id: int
    filename: str
    total_records: int
    successful_records: int
    duplicate_records: int
    invalid_records: int
    rejected_records: int
    status: str
    has_rejected_data: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CSVPreviewResponse(BaseModel):
    filename: str
    headers: List[str]
    suggested_mapping: Dict[str, str]
    preview_rows: List[Dict[str, Any]]
    total_rows: int

class CSVImportRequest(BaseModel):
    filename: str
    column_mapping: Dict[str, str]  # CSV header -> Lead field name
    skip_duplicates: bool = True
    auto_validate: bool = True
    auto_enrich: bool = False
    rows: List[Dict[str, Any]]

class CSVImportResultResponse(BaseModel):
    import_history_id: int
    filename: str
    total_records: int
    successful_records: int
    duplicate_records: int
    invalid_records: int
    rejected_records: int
    rejected_rows: List[Dict[str, Any]] = []

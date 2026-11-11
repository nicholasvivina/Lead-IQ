from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class ImportHistory(Base):
    __tablename__ = "import_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    total_records = Column(Integer, default=0, nullable=False)
    successful_records = Column(Integer, default=0, nullable=False)
    duplicate_records = Column(Integer, default=0, nullable=False)
    invalid_records = Column(Integer, default=0, nullable=False)
    rejected_records = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    rejected_data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    @property
    def has_rejected_data(self) -> bool:
        return bool(self.rejected_data_json)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "total_records": self.total_records,
            "successful_records": self.successful_records,
            "duplicate_records": self.duplicate_records,
            "invalid_records": self.invalid_records,
            "rejected_records": self.rejected_records,
            "status": self.status,
            "has_rejected_data": bool(self.rejected_data_json),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

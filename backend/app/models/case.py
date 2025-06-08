from sqlalchemy import Column, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from database import Base

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(String, primary_key=True, index=True)
    audio_file_path = Column(String, nullable=False)
    transcription = Column(Text)
    specialty = Column(String)
    case_type = Column(String)
    complexity = Column(String)
    patient_age_range = Column(String)
    patient_gender = Column(String)
    summary = Column(Text)
    key_findings = Column(JSON)
    differential_diagnosis = Column(JSON)
    learning_points = Column(JSON)
    tags = Column(JSON)
    notes = Column(Text)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "audio_file_path": self.audio_file_path,
            "transcription": self.transcription,
            "specialty": self.specialty,
            "case_type": self.case_type,
            "complexity": self.complexity,
            "patient_demographics": {
                "age_range": self.patient_age_range,
                "gender": self.patient_gender
            },
            "summary": self.summary,
            "key_findings": self.key_findings or [],
            "differential_diagnosis": self.differential_diagnosis or [],
            "learning_points": self.learning_points or [],
            "tags": self.tags or [],
            "notes": self.notes,
            "is_favorite": self.is_favorite,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
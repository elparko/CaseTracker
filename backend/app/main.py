from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

# Use absolute imports instead of relative imports
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models.case import Case

# Try to import optional services
try:
    from services.whisper_service import WhisperService
    WHISPER_AVAILABLE = True
    whisper_service = WhisperService()
except ImportError:
    print("Warning: Whisper not available. Audio transcription will be disabled.")
    WHISPER_AVAILABLE = False
    whisper_service = None

try:
    from services.ollama_service import OllamaService
    OLLAMA_AVAILABLE = True
    ollama_service = OllamaService(model="medllama2:latest")
except ImportError:
    print("Warning: Ollama service not available. Case analysis will be disabled.")
    OLLAMA_AVAILABLE = False
    ollama_service = None

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Medical Case Tracker", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

os.makedirs("audio_files", exist_ok=True)
os.makedirs("data", exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_case_analysis(transcription: str):
    """Get case analysis from Ollama or return fallback"""
    if OLLAMA_AVAILABLE and ollama_service:
        import asyncio
        return asyncio.create_task(ollama_service.analyze_case(transcription))
    else:
        return {
            'specialty': 'General Medicine',
            'case_type': 'Clinical Case',
            'complexity': 'medium',
            'patient_demographics': {
                'age_range': 'not specified',
                'gender': 'not specified'
            },
            'summary': transcription[:200] + "..." if len(transcription) > 200 else transcription,
            'key_findings': ['Case processed without AI analysis'],
            'differential_diagnosis': [],
            'learning_points': ['Case needs manual analysis'],
            'tags': ['processed']
        }

@app.get("/")
async def root():
    return {
        "message": "Medical Case Tracker API",
        "whisper_available": WHISPER_AVAILABLE,
        "ollama_available": OLLAMA_AVAILABLE
    }

@app.post("/api/transcribe-only")
async def transcribe_only(audio: UploadFile = File(...)):
    """Transcribe audio without analysis"""
    try:
        audio_id = str(uuid.uuid4())
        audio_path = f"audio_files/{audio_id}.wav"
        
        with open(audio_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        
        # Only transcribe, don't analyze
        if WHISPER_AVAILABLE and whisper_service:
            transcription = await whisper_service.transcribe(audio_path)
        else:
            transcription = "Transcription not available - Whisper not installed"
        
        # Clean up audio file (optional, since it's just for transcription)
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        return {
            "transcription": transcription
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-transcription")
async def analyze_transcription(request: dict, db: Session = Depends(get_db)):
    """Analyze a transcription text and save as case"""
    try:
        transcription = request.get("transcription", "")
        audio_file_name = request.get("audio_file_name", "manual_entry")
        
        if not transcription.strip():
            raise HTTPException(status_code=400, detail="Transcription is required")
        
        # Analyze with Ollama
        if OLLAMA_AVAILABLE and ollama_service:
            case_analysis = await ollama_service.analyze_case(transcription)
        else:
            case_analysis = {
                'specialty': 'General Medicine',
                'case_type': 'Clinical Case',
                'complexity': 'medium',
                'patient_demographics': {
                    'age_range': 'not specified',
                    'gender': 'not specified'
                },
                'summary': transcription[:200] + "..." if len(transcription) > 200 else transcription,
                'key_findings': ['Manual entry processed'],
                'differential_diagnosis': [],
                'learning_points': ['Case needs manual analysis'],
                'tags': ['manual']
            }
        
        # Save to database
        case_id = str(uuid.uuid4())
        
        db_case = Case(
            id=case_id,
            audio_file_path=audio_file_name,
            transcription=transcription,
            specialty=case_analysis.get('specialty', ''),
            case_type=case_analysis.get('case_type', ''),
            complexity=case_analysis.get('complexity', ''),
            patient_age_range=case_analysis.get('patient_demographics', {}).get('age_range', ''),
            patient_gender=case_analysis.get('patient_demographics', {}).get('gender', ''),
            summary=case_analysis.get('summary', ''),
            key_findings=case_analysis.get('key_findings', []),
            differential_diagnosis=case_analysis.get('differential_diagnosis', []),
            learning_points=case_analysis.get('learning_points', []),
            tags=case_analysis.get('tags', []),
            created_at=datetime.utcnow()
        )
        
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        
        return {
            "case_id": case_id,
            "transcription": transcription,
            "analysis": case_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cases/upload-audio")
async def upload_audio(audio: UploadFile = File(...), db: Session = Depends(get_db)):
    """Legacy endpoint - upload and process audio in one step"""
    try:
        audio_id = str(uuid.uuid4())
        audio_path = f"audio_files/{audio_id}.wav"
        
        with open(audio_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        
        # Transcribe
        if WHISPER_AVAILABLE and whisper_service:
            transcription = await whisper_service.transcribe(audio_path)
        else:
            transcription = "Transcription not available - Whisper not installed"
        
        # Analyze
        if OLLAMA_AVAILABLE and ollama_service:
            case_analysis = await ollama_service.analyze_case(transcription)
        else:
            case_analysis = {
                'specialty': 'General Medicine',
                'case_type': 'Clinical Case',
                'complexity': 'medium',
                'patient_demographics': {
                    'age_range': 'not specified',
                    'gender': 'not specified'
                },
                'summary': f"Audio file uploaded: {audio.filename}",
                'key_findings': ['Audio file processed'],
                'differential_diagnosis': [],
                'learning_points': ['Case needs manual analysis'],
                'tags': ['uploaded']
            }
        
        db_case = Case(
            id=audio_id,
            audio_file_path=audio_path,
            transcription=transcription,
            specialty=case_analysis.get('specialty', ''),
            case_type=case_analysis.get('case_type', ''),
            complexity=case_analysis.get('complexity', ''),
            patient_age_range=case_analysis.get('patient_demographics', {}).get('age_range', ''),
            patient_gender=case_analysis.get('patient_demographics', {}).get('gender', ''),
            summary=case_analysis.get('summary', ''),
            key_findings=case_analysis.get('key_findings', []),
            differential_diagnosis=case_analysis.get('differential_diagnosis', []),
            learning_points=case_analysis.get('learning_points', []),
            tags=case_analysis.get('tags', []),
            created_at=datetime.utcnow()
        )
        
        db.add(db_case)
        db.commit()
        db.refresh(db_case)
        
        return {
            "case_id": audio_id,
            "transcription": transcription,
            "analysis": case_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cases")
async def get_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cases = db.query(Case).offset(skip).limit(limit).all()
    return [case.to_dict() for case in cases]

@app.get("/api/cases/{case_id}")
async def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case.to_dict()

@app.put("/api/cases/{case_id}")
async def update_case(case_id: str, case_data: dict, db: Session = Depends(get_db)):
    """Update case details"""
    try:
        print(f"Updating case {case_id} with data: {case_data}")  # Debug log
        
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # List of fields that can be updated
        allowed_fields = {
            'specialty', 'case_type', 'complexity', 'summary', 'transcription',
            'key_findings', 'differential_diagnosis', 'learning_points', 'tags',
            'notes', 'is_favorite'
        }
        
        # Handle nested patient_demographics
        if 'patient_demographics' in case_data:
            demographics = case_data.pop('patient_demographics')
            if isinstance(demographics, dict):
                case.patient_age_range = demographics.get('age_range', case.patient_age_range)
                case.patient_gender = demographics.get('gender', case.patient_gender)
        
        # Convert JSON fields to lists if they're not already
        json_fields = ['key_findings', 'differential_diagnosis', 'learning_points', 'tags']
        for field in json_fields:
            if field in case_data and not isinstance(case_data[field], list):
                case_data[field] = []
        
        # Update only allowed fields
        for key, value in case_data.items():
            if key in allowed_fields:
                print(f"Setting {key} = {value}")  # Debug log
                setattr(case, key, value)
            else:
                print(f"Warning: Field {key} not allowed for update")  # Debug log
        
        case.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(case)
        
        print(f"Case {case_id} updated successfully")  # Debug log
        return case.to_dict()
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error updating case {case_id}: {e}")  # Debug log
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update case: {str(e)}")

@app.delete("/api/cases/{case_id}")
async def delete_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if os.path.exists(case.audio_file_path):
        os.remove(case.audio_file_path)
    
    db.delete(case)
    db.commit()
    return {"message": "Case deleted successfully"}

@app.get("/api/analytics/summary")
async def get_analytics(db: Session = Depends(get_db)):
    try:
        total_cases = db.query(Case).count()
        
        specialty_counts = {}
        specialties = db.query(Case.specialty).distinct().all()
        for (specialty,) in specialties:
            if specialty:
                count = db.query(Case).filter(Case.specialty == specialty).count()
                specialty_counts[specialty] = count
        
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_cases = db.query(Case).filter(Case.created_at >= thirty_days_ago).count()
        
        return {
            "total_cases": total_cases,
            "specialty_distribution": specialty_counts,
            "recent_cases": recent_cases
        }
    except Exception as e:
        print(f"Analytics error: {e}")
        return {
            "total_cases": 0,
            "specialty_distribution": {},
            "recent_cases": 0
        }
@app.get("/api/tags")
async def get_all_tags(db: Session = Depends(get_db)):
    """Get all unique tags from all cases"""
    try:
        # Get all cases and extract tags
        cases = db.query(Case).all()
        all_tags = set()
        
        for case in cases:
            if case.tags:
                all_tags.update(case.tags)
        
        # Sort tags alphabetically
        sorted_tags = sorted(list(all_tags))
        
        # Count frequency of each tag
        tag_counts = {}
        for case in cases:
            if case.tags:
                for tag in case.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        return {
            "tags": sorted_tags,
            "tag_counts": tag_counts,
            "total_unique_tags": len(sorted_tags)
        }
    except Exception as e:
        print(f"Tags error: {e}")
        return {
            "tags": [],
            "tag_counts": {},
            "total_unique_tags": 0
        }

@app.delete("/api/cases/{case_id}/tags")
async def remove_tags_from_case(case_id: str, request: dict, db: Session = Depends(get_db)):
    """Remove specific tags from a case"""
    try:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        tags_to_remove = request.get("tags", [])
        if not isinstance(tags_to_remove, list):
            raise HTTPException(status_code=400, detail="Tags must be a list")
        
        existing_tags = case.tags or []
        updated_tags = [tag for tag in existing_tags if tag not in tags_to_remove]
        
        case.tags = updated_tags
        case.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(case)
        
        return {
            "case_id": case_id,
            "tags": updated_tags,
            "message": "Tags removed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
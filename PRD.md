# Medical Case Tracking App - Tech Stack & PRD

## Tech Stack Recommendation (Local-Only)

### Frontend
- **React** with TypeScript for type safety
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form management
- **Recharts** for data visualization/analytics
- **Web Speech API** for browser-based recording (no external APIs)

### Backend
- **Python FastAPI** for local REST API
- **SQLAlchemy** with **SQLite** for local database
- **Pydantic** for data validation
- **Uvicorn** for local server

### AI/ML Components
- **OpenAI Whisper** (local installation) for speech-to-text
- **Ollama** (local LLM) for case analysis and data extraction
- **Python requests** for Ollama API calls

### Local Infrastructure
- **SQLite database** (single file, portable)
- **Local file system** for audio storage
- **Python virtual environment** for dependencies
- **Node.js** for React development server

### Security & Privacy
- **No authentication needed** (single user, local only)
- **Local file encryption** (optional, OS-level)
- **All data stays on your machine**
- **No network requests** except to local Ollama instance

---

## Product Requirements Document (PRD)

### Executive Summary
A voice-enabled medical case tracking application for medical students to record, analyze, and organize clinical encounters using AI-powered transcription and data extraction.

### Problem Statement
As a medical student, you need an efficient way to:
- Document clinical cases encountered during rotations
- Extract structured information from unstructured voice notes
- Track learning progress and case variety
- Maintain private, local records for educational purposes

### Target Users
- **You** - Single user, local installation for personal use during medical school

### Core Features

#### 1. Voice Recording & Transcription
- **Voice Journal**: Record case notes via microphone
- **Real-time Transcription**: Convert speech to text using Whisper
- **Playback**: Review original audio recordings
- **Edit Transcription**: Manual correction of transcribed text

#### 2. AI-Powered Case Analysis
- **Automatic Segmentation**: Extract structured data from transcription
- **Case Classification**: Identify medical specialty, case type, complexity
- **Patient Demographics**: Age range, gender (anonymized)
- **Clinical Summary**: Generate concise case overview
- **Learning Objectives**: Suggest relevant medical concepts

#### 3. Case Management
- **Case Library**: Searchable database of all recorded cases
- **Tagging System**: Custom tags for organization
- **Filtering**: By specialty, date, case type, patient demographics
- **Export**: PDF reports for portfolio/evaluation purposes

#### 4. Analytics Dashboard
- **Case Statistics**: Total cases, cases by specialty, monthly trends
- **Learning Progress**: Track exposure to different conditions
- **Specialty Distribution**: Visual breakdown of case types
- **Goal Tracking**: Set and monitor case collection targets

#### 5. Local Data Management
- **SQLite Database**: Single-file database stored locally
- **Audio Files**: Stored in local filesystem
- **Backup**: Simple folder backup/sync options
- **Import/Export**: JSON export for data portability
- **No Cloud Dependencies**: Everything runs offline

### Technical Requirements

#### Performance
- **Transcription Speed**: Depends on local Whisper model size
- **Response Time**: Local API responses < 1 second
- **Storage**: SQLite can handle 10,000+ cases easily
- **Offline Only**: No internet required after initial setup

#### Compatibility
- **Local Environment**: Your development machine
- **OS**: Windows, macOS, or Linux
- **Browser**: Any modern browser for the React frontend
- **Hardware**: Sufficient RAM for Whisper + Ollama models

#### Setup Requirements
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Ollama** installed locally
- **FFmpeg** for audio processing (Whisper dependency)

### Data Schema

#### Case Record
```json
{
  "id": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "audio_file_path": "/local/path/to/audio.wav",
  "transcription": "text",
  "case_data": {
    "specialty": "string",
    "case_type": "string", 
    "complexity": "string",
    "patient_demographics": {
      "age_range": "string",
      "gender": "string"
    },
    "summary": "text",
    "key_findings": ["string"],
    "differential_diagnosis": ["string"],
    "learning_points": ["string"]
  },
  "tags": ["string"],
  "is_favorite": "boolean",
  "notes": "text"
}
```

### User Stories

#### Core Workflow
1. **As a medical student**, I want to quickly record a case on my personal device so I can capture details privately
2. **As a medical student**, I want the app to automatically extract key information locally so no data leaves my machine
3. **As a medical student**, I want to search my cases by condition or specialty for personal review
4. **As a medical student**, I want to see my learning progress in a personal dashboard

#### Additional Features  
5. **As a medical student**, I want to export case summaries for my personal portfolio
6. **As a medical student**, I want to backup my data easily so I don't lose my case collection
7. **As a medical student**, I want to add personal notes and reflections to each case

### MVP Features (Phase 1)
- Voice recording and local Whisper transcription
- Local Ollama integration for case analysis  
- SQLite database for case storage
- Basic search and filtering
- Simple React frontend

### Future Enhancements (Phase 2+)
- Advanced analytics dashboard
- Better audio quality optimization
- Batch processing of multiple recordings
- Custom Ollama model fine-tuning
- Advanced export formats (PDF, Word)
- Personal learning goal tracking

### Local Setup Process
1. **Install Dependencies**:
   - Python 3.8+ with pip
   - Node.js 16+ with npm
   - Ollama (pull medical-focused model)
   - FFmpeg for audio processing

2. **Initial Setup**:
   - Clone/download application code
   - Create Python virtual environment
   - Install Python requirements (FastAPI, Whisper, SQLAlchemy)
   - Install Node dependencies for React app
   - Initialize SQLite database

3. **Daily Usage**:
   - Start local Python API server
   - Start React development server
   - Open localhost in browser
   - Begin recording cases

### Privacy Considerations
- **Complete Privacy**: All data stays on your local machine
- **No Network Transmission**: Zero external API calls or data sharing
- **Local AI Processing**: Whisper and Ollama run entirely offline
- **Simple Backup**: Easy folder-based backup to external drive/cloud storage of your choice
- **Portable**: Entire database in single SQLite file

### Success Metrics
- **Personal Usage**: Cases recorded per week/month
- **AI Accuracy**: Transcription and analysis quality for your use cases
- **Learning Value**: How well it helps you track and review clinical experiences
- **Ease of Use**: How quickly you can record and retrieve cases

### Development Timeline
- **Phase 1 (MVP)**: 6-8 weeks of personal development time
- **Phase 2 (Enhancements)**: 4-6 weeks additional features
- **Ongoing**: Iterative improvements based on your usage

### Key Benefits of Local-Only Approach
- **Maximum Privacy**: No external services or data transmission
- **No Costs**: No API fees or subscription services
- **Full Control**: Customize everything to your specific needs
- **Reliable**: Works without internet connection
- **Fast**: No network latency, all processing local
- **Portable**: Can run on laptop during rotations
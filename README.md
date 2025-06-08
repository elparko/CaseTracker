 # Medical Case Tracker

A local, privacy-focused application for medical students to record, transcribe, and analyze clinical cases using AI. All data stays on your machine with no external API calls.

## Features

- 🎤 **Voice Recording**: Record cases directly in your browser
- 🔄 **AI Transcription**: Local Whisper integration for speech-to-text
- 🧠 **Case Analysis**: Local Ollama LLM extracts structured medical information
- 📊 **Analytics Dashboard**: Track learning progress and case distribution
- 🔒 **Complete Privacy**: All processing happens locally, no cloud services
- 💾 **Local Storage**: SQLite database for fast, portable storage

## Prerequisites

Before installation, ensure you have:

1. **Python 3.8+** - [Download](https://python.org)
2. **Node.js 16+** - [Download](https://nodejs.org)
3. **Ollama** - [Download](https://ollama.ai)
4. **FFmpeg** - Required for Whisper audio processing
   - macOS: `brew install ffmpeg`
   - Ubuntu: `sudo apt update && sudo apt install ffmpeg`
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org)

## Quick Start

### 1. Install Ollama and Model

```bash
# Install Ollama (follow instructions at ollama.ai)
# Then pull a medical-suitable model:
ollama pull llama2:7b
# Or for better performance (if you have enough RAM):
ollama pull llama2:13b
```

### 2. Clone/Create Project Structure

```bash
mkdir medical-case-tracker
cd medical-case-tracker
```

### 3. Setup Backend

```bash
# Create backend directory and files
mkdir -p backend/app/{models,api,services}
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic python-multipart openai-whisper requests

# Copy the backend code files (main.py, models, services, etc.)
```

### 4. Setup Frontend

```bash
# From project root
cd frontend

# If creating from scratch:
npx create-react-app . --template typescript

# Install dependencies
npm install lucide-react react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer @types/react-router-dom

# Initialize Tailwind
npx tailwindcss init -p

# Copy the frontend code files (components, services, etc.)
```

### 5. Start the Application

**Option 1: Manual Start**

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
python -m app.main
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

**Option 2: Using Run Script**
```bash
chmod +x run.sh
./run.sh
```

### 6. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Recording Your First Case

1. **Navigate to Record**: Click "Record" in the navigation
2. **Start Recording**: Click "Start Recording" and speak your case notes
3. **Stop Recording**: Click "Stop Recording" when finished
4. **Process Case**: Click "Process Case" to transcribe and analyze
5. **Review Results**: The AI will extract key information automatically

### Example Case Recording

> "This is a 45-year-old male presenting to the emergency department with chest pain. The pain started 2 hours ago, described as crushing, radiating to the left arm. Patient has a history of hypertension and smoking. Vital signs show blood pressure 160/90, heart rate 95. EKG shows ST elevation in leads II, III, and aVF suggesting inferior wall MI. Patient was given aspirin and nitroglycerin with some relief. This case taught me the importance of rapid EKG interpretation in chest pain patients."

The AI will automatically extract:
- **Specialty**: Emergency Medicine
- **Case Type**: Acute
- **Patient Demographics**: 45-year-old male
- **Key Findings**: Chest pain, ST elevation, inferior MI
- **Learning Points**: EKG interpretation importance

### Managing Cases

- **View Cases**: Browse all cases in the "Cases" section
- **Search & Filter**: Find cases by keyword or specialty
- **Edit Cases**: Add personal notes and modify AI-extracted information
- **Favorite Cases**: Mark important cases for quick access
- **Delete Cases**: Remove cases you no longer need

### Analytics

Track your progress with:
- Total cases recorded
- Distribution by medical specialty
- Learning trend over time
- Most common case types

## File Structure

```
medical-case-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/
│   │   │   └── case.py          # Case data model
│   │   └── services/
│   │       ├── whisper_service.py  # Speech-to-text
│   │       └── ollama_service.py   # LLM analysis
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/            # API client
│   │   ├── types/               # TypeScript types
│   │   └── App.tsx              # Main application
│   └── package.json
├── data/
│   └── cases.db                 # SQLite database
├── audio_files/                 # Recorded audio files
└── README.md
```

## Configuration

### Whisper Model Size

Edit `backend/app/services/whisper_service.py` to change model size:

```python
# Options: tiny, base, small, medium, large
self.model = whisper.load_model("base")  # Default
```

**Model Trade-offs:**
- `tiny`: Fastest, least accurate
- `base`: Good balance (recommended)
- `small`: Better accuracy, slower
- `medium`: High accuracy, requires more RAM
- `large`: Best accuracy, requires significant RAM

### Ollama Model

Change the model in `backend/app/services/ollama_service.py`:

```python
def __init__(self, model: str = "llama2:7b"):  # Change here
```

**Recommended Models:**
- `llama2:7b`: Good general performance
- `llama2:13b`: Better analysis (needs 16GB+ RAM)
- `codellama:7b`: Good for technical medical content
- `mistral:7b`: Fast and accurate alternative

## Troubleshooting

### Common Issues

**1. Microphone Permission Denied**
- Ensure browser has microphone permissions
- Check system microphone settings
- Try HTTPS if accessing remotely

**2. Whisper Installation Fails**
- Install FFmpeg first
- Try: `pip install --upgrade pip setuptools wheel`
- On M1 Mac: `pip install openai-whisper --no-deps`

**3. Ollama Connection Error**
- Ensure Ollama is running: `ollama serve`
- Check if model is pulled: `ollama list`
- Verify port 11434 is available

**4. "Module not found" Errors**
- Activate virtual environment: `source venv/bin/activate`
- Reinstall requirements: `pip install -r requirements.txt`

**5. React Build Errors**
- Clear cache: `npm start -- --reset-cache`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Performance Optimization

**For Better Transcription:**
- Use a good quality microphone
- Record in a quiet environment
- Speak clearly and at moderate pace
- Use the `medium` or `large` Whisper model if you have enough RAM

**For Faster Processing:**
- Use smaller Whisper model (`tiny` or `base`)
- Use faster Ollama model (`mistral:7b`)
- Ensure sufficient RAM (8GB minimum, 16GB recommended)

## Privacy & Security

This application is designed with privacy in mind:

- ✅ **No External APIs**: All processing happens locally
- ✅ **No Data Transmission**: Nothing leaves your computer
- ✅ **Local Storage**: SQLite database stays on your machine
- ✅ **No Authentication**: Single-user, no account needed
- ✅ **Portable**: Easy to backup and move

### Data Backup

Your data is stored in:
- **Database**: `data/cases.db`
- **Audio Files**: `audio_files/`

**To backup:**
```bash
# Create backup folder
mkdir backup-$(date +%Y%m%d)
cp -r data/ audio_files/ backup-$(date +%Y%m%d)/
```

**To restore:**
```bash
cp -r backup-20240301/data/ .
cp -r backup-20240301/audio_files/ .
```

## Development

### Adding New Features

The application is modular and easy to extend:

**Backend (Python/FastAPI):**
- Add new API endpoints in `backend/app/api/routes.py`
- Extend the Case model in `backend/app/models/case.py`
- Add new services in `backend/app/services/`

**Frontend (React/TypeScript):**
- Add new components in `frontend/src/components/`
- Extend API client in `frontend/src/services/api.ts`
- Add new pages in `frontend/src/pages/`

### Custom Ollama Prompts

Modify the analysis prompt in `backend/app/services/ollama_service.py`:

```python
def _create_analysis_prompt(self, transcription: str) -> str:
    return f"""
    Your custom prompt here...
    Medical case: {transcription}
    """
```

## License

This project is for educational use. Ensure compliance with your institution's policies regarding patient information and clinical documentation.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure Ollama is running with a suitable model
4. Check that all required ports (3000, 8000, 11434) are available

Remember: This tool is for educational case tracking only. Always follow your institution's guidelines for patient privacy and clinical documentation.
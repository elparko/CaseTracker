 # setup.sh
#!/bin/bash

echo "Setting up Medical Case Tracker..."

# Check if Python 3.8+ is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3.8+ is required. Please install Python first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js 16+ is required. Please install Node.js first."
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is required. Please install Ollama first:"
    echo "Visit: https://ollama.ai/"
    exit 1
fi

# Create project directories
echo "Creating project structure..."
mkdir -p medical-case-tracker/{backend/app/{models,api,services},frontend/src/{components,pages,services,types},data,audio_files}

# Setup backend
echo "Setting up backend..."
cd medical-case-tracker/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install fastapi uvicorn sqlalchemy pydantic python-multipart openai-whisper requests

# Setup frontend
echo "Setting up frontend..."
cd ../frontend

# Initialize React app if not already done
if [ ! -f "package.json" ]; then
    npx create-react-app . --template typescript
fi

# Install additional dependencies
npm install lucide-react react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer @types/react-router-dom
npx tailwindcss init -p

# Pull Ollama model
echo "Setting up Ollama model..."
ollama pull llama2:7b

echo "Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the backend: cd backend && source venv/bin/activate && python -m app.main"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Open http://localhost:3000 in your browser"

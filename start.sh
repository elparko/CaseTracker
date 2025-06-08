#!/bin/bash

echo "🏥 Starting Medical Case Tracker"
echo "=================================="

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null
        echo -e "${GREEN}✅ Ollama stopped${NC}"
    else
        echo -e "${BLUE}ℹ️  Ollama was already running (left running)${NC}"
    fi
    
    echo -e "${GREEN}👋 Goodbye!${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Could not find frontend and backend directories.${NC}"
    echo "Please run this script from the CaseTracker directory."
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama is not installed. Please install it from https://ollama.ai${NC}"
    exit 1
fi

echo -e "${BLUE}🧠 Checking Ollama...${NC}"

# Check if Ollama is already running
if pgrep -x "ollama" > /dev/null; then
    echo -e "${GREEN}✅ Ollama service already running${NC}"
    OLLAMA_WAS_RUNNING=true
else
    echo -e "${YELLOW}🚀 Starting Ollama service...${NC}"
    ollama serve > /dev/null 2>&1 &
    OLLAMA_PID=$!
    OLLAMA_WAS_RUNNING=false
    sleep 3
fi

# Check if medllama2 model is available
echo -e "${BLUE}🔍 Checking for MedLLaMA model...${NC}"
if ! ollama list | grep -q "medllama2"; then
    echo -e "${YELLOW}📥 MedLLaMA model not found. Available models:${NC}"
    ollama list
    echo ""
    echo -e "${YELLOW}Would you like to pull medllama2:latest? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}⬇️  Downloading medllama2:latest (this may take several minutes)...${NC}"
        ollama pull medllama2:latest
    else
        echo -e "${YELLOW}⚠️  Continuing without medllama2. AI analysis may use fallback mode.${NC}"
    fi
else
    echo -e "${GREEN}✅ MedLLaMA model found${NC}"
fi

# Test Ollama connection
echo -e "${BLUE}🔗 Testing Ollama connection...${NC}"
if curl -s http://localhost:11434/api/version > /dev/null; then
    echo -e "${GREEN}✅ Ollama is responding${NC}"
else
    echo -e "${RED}❌ Ollama is not responding. Please check the service.${NC}"
    if [ "$OLLAMA_WAS_RUNNING" = false ]; then
        kill $OLLAMA_PID 2>/dev/null
    fi
    exit 1
fi

# Start backend
echo -e "${BLUE}🐍 Starting backend server...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}🔧 Creating Python virtual environment...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    pip install --upgrade pip > /dev/null 2>&1
    pip install fastapi uvicorn sqlalchemy pydantic python-multipart requests python-json-logger > /dev/null 2>&1
    pip install torch torchaudio > /dev/null 2>&1
    pip install faster-whisper > /dev/null 2>&1
else
    source venv/bin/activate
fi

# Check if FastAPI is installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${BLUE}📦 Installing missing Python dependencies...${NC}"
    pip install fastapi uvicorn sqlalchemy pydantic python-multipart requests python-json-logger > /dev/null 2>&1
    pip install torch torchaudio > /dev/null 2>&1
    pip install faster-whisper > /dev/null 2>&1
fi

# Create directories if they don't exist
mkdir -p ../data ../audio_files

# Start backend server
echo -e "${BLUE}🚀 Backend starting on http://localhost:8000${NC}"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may still be starting... Check backend.log for details${NC}"
fi

cd ..

# Start frontend
echo -e "${BLUE}⚛️  Starting frontend server...${NC}"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
    npm install > /dev/null 2>&1
fi

echo -e "${BLUE}🚀 Frontend starting on http://localhost:3000${NC}"
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..

# Wait a moment for frontend to start
sleep 3

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo "=================================="
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:8000"
echo -e "${BLUE}📚 API Docs:${NC} http://localhost:8000/docs"
echo -e "${BLUE}🧠 Ollama:${NC} http://localhost:11434"
echo ""
echo -e "${GREEN}💡 Tips:${NC}"
echo "- Visit http://localhost:3000 to use the app"
echo "- Check backend.log and frontend.log for detailed logs"
echo "- Press Ctrl+C to stop all services"
echo ""
echo -e "${YELLOW}⏳ Services are running... (Press Ctrl+C to stop)${NC}"

# Function to show status every 30 seconds
show_status() {
    while true; do
        sleep 30
        echo -e "${BLUE}📊 Status check - $(date '+%H:%M:%S')${NC}"
        
        # Check backend
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            echo -e "${GREEN}  ✅ Backend: Running${NC}"
        else
            echo -e "${RED}  ❌ Backend: Not responding${NC}"
        fi
        
        # Check frontend (just check if process is running)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${GREEN}  ✅ Frontend: Running${NC}"
        else
            echo -e "${RED}  ❌ Frontend: Not running${NC}"
        fi
        
        # Check Ollama
        if curl -s http://localhost:11434/api/version > /dev/null; then
            echo -e "${GREEN}  ✅ Ollama: Running${NC}"
        else
            echo -e "${RED}  ❌ Ollama: Not responding${NC}"
        fi
        echo ""
    done
}

# Start status monitoring in background
show_status &
STATUS_PID=$!

# Wait for processes to finish
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null

# Clean up status monitoring
kill $STATUS_PID 2>/dev/null

# Call cleanup function
cleanup
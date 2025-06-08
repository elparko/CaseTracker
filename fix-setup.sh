#!/bin/bash
# fix-setup.sh

echo "🔧 Fixing setup issues..."

# Navigate to your project directory
cd medical-case-tracker

# Fix Backend Dependencies
echo "🐍 Fixing Python dependencies..."
cd backend

# Activate virtual environment
source venv/bin/activate

# Update requirements.txt with compatible versions
cat > requirements.txt << EOF
fastapi==0.115.12
uvicorn==0.34.2
sqlalchemy==2.0.41
pydantic==2.11.5
python-multipart==0.0.20
openai-whisper==20240930
requests==2.31.0
python-json-logger==2.0.7
torch
torchaudio
numba!=0.57.0
EOF

# Install dependencies with specific strategy for Whisper
echo "📦 Installing Python packages (this may take a few minutes)..."
pip install --upgrade pip setuptools wheel

# Install Whisper dependencies first
pip install torch torchaudio

# Install Whisper with no-deps and then install missing deps
pip install --no-deps openai-whisper==20240930
pip install tiktoken regex tqdm numpy numba!=0.57.0 ffmpeg-python

# Install other requirements
pip install fastapi uvicorn sqlalchemy pydantic python-multipart requests python-json-logger

echo "✅ Backend dependencies fixed!"

# Fix Frontend Setup
echo "⚛️  Fixing React frontend..."
cd ../frontend

# Clear any conflicting files from incomplete setup
rm -rf src/App.* src/index.* src/setupTests.js src/reportWebVitals.js src/logo.svg

# Continue with npm setup
echo "📦 Installing remaining Node.js packages..."
npm install

echo "✅ Frontend dependencies installed!"

cd ..

echo ""
echo "🎉 Setup fixed! Now let's create the code files..."
echo ""
echo "Next steps:"
echo "1. I'll provide you with all the code files to copy"
echo "2. Copy each file to the correct location"
echo "3. Run the application"
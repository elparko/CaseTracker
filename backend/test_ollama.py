import asyncio
from app.services.ollama_service import OllamaService

async def test_ollama():
    print("Testing Ollama connection with MedLLaMA...")
    
    # Use the medical model
    ollama = OllamaService(model="medllama2:latest")
    
    # Test with a simple medical case
    test_transcription = """
    This is a 45-year-old male presenting to the emergency department with chest pain. 
    The pain started 2 hours ago, described as crushing, radiating to the left arm. 
    Patient has a history of hypertension and smoking. Vital signs show blood pressure 160/90, heart rate 95. 
    EKG shows ST elevation in leads II, III, and aVF suggesting inferior wall MI.
    """
    
    try:
        print("Sending request to Ollama...")
        result = await ollama.analyze_case(test_transcription)
        print("✅ Ollama analysis successful!")
        print(f"Specialty: {result.get('specialty')}")
        print(f"Summary: {result.get('summary')}")
        print(f"Key findings: {result.get('key_findings')}")
        print(f"Learning points: {result.get('learning_points')}")
        return True
    except Exception as e:
        print(f"❌ Ollama analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_ollama())
    if success:
        print("\n🎉 MedLLaMA integration is working!")
    else:
        print("\n⚠️  MedLLaMA integration needs debugging")
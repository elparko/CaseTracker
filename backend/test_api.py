import requests
import json
import os
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_AUDIO_FILE = "test_audio.wav"

def test_health_check():
    """Test if the API is running"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:8000")
        return False

def test_api_docs():
    """Test if API documentation is accessible"""
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"✅ API docs: {response.status_code}")
        return response.status_code == 200
    except:
        print("❌ API docs not accessible")
        return False

def test_get_cases_empty():
    """Test getting cases when database is empty"""
    try:
        response = requests.get(f"{BASE_URL}/api/cases")
        print(f"✅ Get cases: {response.status_code}")
        cases = response.json()
        print(f"   Found {len(cases)} cases")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Get cases failed: {e}")
        return False

def test_analytics():
    """Test analytics endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/analytics/summary")
        print(f"✅ Analytics: {response.status_code}")
        analytics = response.json()
        print(f"   Analytics: {analytics}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Analytics failed: {e}")
        return False

def create_test_audio_file():
    """Create a simple test audio file"""
    try:
        import wave
        import numpy as np
        
        # Create a simple sine wave audio file
        sample_rate = 44100
        duration = 2  # seconds
        frequency = 440  # A4 note
        
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio_data = np.sin(2 * np.pi * frequency * t)
        
        # Convert to 16-bit integers
        audio_data = (audio_data * 32767).astype(np.int16)
        
        # Save as WAV file
        with wave.open(TEST_AUDIO_FILE, 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 2 bytes per sample
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio_data.tobytes())
        
        print(f"✅ Created test audio file: {TEST_AUDIO_FILE}")
        return True
    except ImportError:
        print("⚠️  numpy/wave not available, skipping audio file creation")
        return False
    except Exception as e:
        print(f"❌ Failed to create audio file: {e}")
        return False

def test_upload_audio():
    """Test audio upload endpoint"""
    # First, try to create a test audio file
    if not create_test_audio_file():
        print("⚠️  Skipping audio upload test (no test file)")
        return False
    
    try:
        with open(TEST_AUDIO_FILE, 'rb') as audio_file:
            files = {'audio': (TEST_AUDIO_FILE, audio_file, 'audio/wav')}
            
            print("📤 Uploading test audio file...")
            response = requests.post(f"{BASE_URL}/api/cases/upload-audio", files=files)
            
            print(f"✅ Upload audio: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   Case ID: {result.get('case_id')}")
                print(f"   Transcription: {result.get('transcription', '')[:100]}...")
                
                # Test getting the uploaded case
                case_id = result.get('case_id')
                if case_id:
                    case_response = requests.get(f"{BASE_URL}/api/cases/{case_id}")
                    if case_response.status_code == 200:
                        print(f"✅ Retrieved uploaded case: {case_id}")
                    else:
                        print(f"❌ Failed to retrieve case: {case_response.status_code}")
                
                return True
            else:
                print(f"❌ Upload failed: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Upload audio failed: {e}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(TEST_AUDIO_FILE):
            os.remove(TEST_AUDIO_FILE)

def test_cors():
    """Test CORS headers for frontend compatibility"""
    try:
        response = requests.options(f"{BASE_URL}/api/cases")
        print(f"✅ CORS preflight: {response.status_code}")
        headers = response.headers
        print(f"   Access-Control-Allow-Origin: {headers.get('access-control-allow-origin', 'Not set')}")
        return response.status_code in [200, 204]
    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("🧪 Testing Medical Case Tracker Backend")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_check),
        ("API Documentation", test_api_docs),
        ("Get Cases (Empty)", test_get_cases_empty),
        ("Analytics", test_analytics),
        ("CORS Headers", test_cors),
        ("Audio Upload", test_upload_audio),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        try:
            if test_func():
                passed += 1
            else:
                print(f"❌ {test_name} failed")
        except Exception as e:
            print(f"❌ {test_name} error: {e}")
    
    print("\n" + "=" * 50)
    print(f"🏆 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    run_all_tests()
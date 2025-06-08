import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, FileText, BarChart3, Mic } from 'lucide-react';
import { Home as HomePage } from './pages/Home.tsx';
import { Cases } from './pages/Cases.tsx';
import { Analytics } from './pages/Analytics.tsx';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/record', icon: Mic, label: 'Record' },
    { path: '/cases', icon: FileText, label: 'Cases' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Medical Case Tracker</h1>
            </div>
          </div>
          
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

const RecordPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Timer for recording duration
  React.useEffect(() => {
    let interval: number | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(time => time + 1);
      }, 1000);
    } else if (!isRecording && recordingTime !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingTime]);

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      setStream(mediaStream);
      
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Stop all tracks to release the microphone
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setTranscription(''); // Clear previous transcription
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    try {
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      // Create form data for transcription-only request
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      // Call transcription endpoint (we'll need to create this)
      const response = await fetch('http://localhost:8000/api/transcribe-only', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const result = await response.json();
      setTranscription(result.transcription);
      setIsEditingTranscription(true);
      
    } catch (error) {
      console.error('Transcription failed:', error);
      alert('Transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const processCase = async () => {
    if (!transcription.trim()) {
      alert('Please provide a transcription before processing.');
      return;
    }
    
    setIsUploading(true);
    try {
      // Send the edited transcription for analysis
      const response = await fetch('http://localhost:8000/api/analyze-transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: transcription,
          audio_file_name: audioBlob ? 'recording.webm' : 'manual_entry'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Case analysis failed');
      }
      
      const result = await response.json();
      console.log('Analysis result:', result);
      alert('Case processed and analyzed successfully!');
      
      // Clear the form
      setAudioBlob(null);
      setTranscription('');
      setIsEditingTranscription(false);
      setRecordingTime(0);
      
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Case processing failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setTranscription('');
    setIsEditingTranscription(false);
    setRecordingTime(0);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      
      const response = await fetch('http://localhost:8000/api/transcribe-only', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const result = await response.json();
      setTranscription(result.transcription);
      setIsEditingTranscription(true);
      
    } catch (error) {
      console.error('Upload and transcription failed:', error);
      alert('Upload failed. Make sure the backend is running.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Record New Case</h2>
        
        <div className="space-y-6">
          {/* Recording Section */}
          <div className="flex flex-col items-center space-y-4">
            {/* Recording Status */}
            <div className="text-center">
              {isRecording && (
                <div className="text-red-500 font-medium animate-pulse flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording: {formatTime(recordingTime)}</span>
                </div>
              )}
              {audioBlob && !isRecording && !isEditingTranscription && (
                <div className="text-green-500 font-medium">
                  ✅ Recording ready ({formatTime(recordingTime)})
                </div>
              )}
              {isTranscribing && (
                <div className="text-blue-500 font-medium flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Transcribing audio...</span>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-4">
              {!isRecording && !audioBlob && !isEditingTranscription ? (
                <button
                  onClick={startRecording}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <span className="w-5 h-5 bg-white rounded-sm"></span>
                  <span>Stop Recording</span>
                </button>
              ) : audioBlob && !isEditingTranscription ? (
                <div className="flex space-x-2">
                  <button
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    {isTranscribing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Transcribing...</span>
                      </>
                    ) : (
                      <>
                        <span>🎵</span>
                        <span>Transcribe Audio</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={discardRecording}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                </div>
              ) : null}
            </div>

            {/* Audio Preview */}
            {audioBlob && (
              <div className="w-full max-w-md">
                <audio 
                  controls 
                  src={URL.createObjectURL(audioBlob)}
                  className="w-full"
                />
              </div>
            )}

            {/* File Upload Option */}
            {!isRecording && !audioBlob && !isEditingTranscription && (
              <div className="w-full max-w-md">
                <div className="text-center text-gray-500 mb-4">or upload an audio file</div>
                <label className="block">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={isTranscribing}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Transcription Editing Section */}
          {isEditingTranscription && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Review & Edit Transcription</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transcription (edit as needed):
                  </label>
                  <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="Edit the transcription here..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Review the transcription above and make any necessary corrections before processing.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={processCase}
                    disabled={isUploading || !transcription.trim()}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>🧠</span>
                        <span>Analyze Case</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setIsEditingTranscription(false)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Back to Recording
                  </button>
                  
                  <button
                    onClick={discardRecording}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Discard All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry Option */}
          {!isRecording && !audioBlob && !isEditingTranscription && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Or Enter Case Manually</h3>
              <div className="space-y-4">
                <textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Type your medical case here directly..."
                />
                <button
                  onClick={processCase}
                  disabled={isUploading || !transcription.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>🧠</span>
                      <span>Analyze Case</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 text-center">
            <p>Record audio, upload a file, or type directly. Review transcriptions before AI analysis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
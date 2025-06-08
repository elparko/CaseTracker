// frontend/src/components/AudioRecorder.tsx
import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { MedicalCase } from '../types/case';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onUploadComplete: (result: any) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onRecordingComplete, 
  onUploadComplete 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        onRecordingComplete(blob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    try {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      const result = await ApiService.uploadAudio(audioFile);
      onUploadComplete(result);
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Record New Case</h2>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Recording Status */}
        <div className="text-center">
          {isRecording && (
            <div className="text-red-500 font-medium">
              Recording: {formatTime(recordingTime)}
            </div>
          )}
          {audioBlob && !isRecording && (
            <div className="text-green-500 font-medium">
              Recording ready ({formatTime(recordingTime)})
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </button>
          )}

          {audioBlob && !isRecording && (
            <button
              onClick={uploadRecording}
              disabled={isUploading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span>{isUploading ? 'Processing...' : 'Process Case'}</span>
            </button>
          )}
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
      </div>
    </div>
  );
};
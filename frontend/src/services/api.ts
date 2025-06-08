// frontend/src/services/api.ts

interface PatientDemographics {
    age_range: string;
    gender: string;
  }
  
  interface MedicalCase {
    id: string;
    audio_file_path: string;
    transcription: string;
    specialty: string;
    case_type: string;
    complexity: string;
    patient_demographics: PatientDemographics;
    summary: string;
    key_findings: string[];
    differential_diagnosis: string[];
    learning_points: string[];
    tags: string[];
    notes?: string;
    is_favorite: boolean;
    created_at: string;
    updated_at?: string;
  }
  
  const API_BASE_URL = 'http://localhost:8000/api';
  
  export class ApiService {
    static async uploadAudio(audioFile: File): Promise<any> {
      const formData = new FormData();
      formData.append('audio', audioFile);
  
      const response = await fetch(`${API_BASE_URL}/cases/upload-audio`, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Failed to upload audio');
      }
  
      return response.json();
    }
  
    static async getCases(skip = 0, limit = 100): Promise<MedicalCase[]> {
      const response = await fetch(`${API_BASE_URL}/cases?skip=${skip}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
  
      return response.json();
    }
  
    static async getCase(caseId: string): Promise<MedicalCase> {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch case');
      }
  
      return response.json();
    }
  
    static async updateCase(caseId: string, caseData: Partial<MedicalCase>): Promise<MedicalCase> {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update case');
      }
  
      return response.json();
    }
  
    static async deleteCase(caseId: string): Promise<void> {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete case');
      }
    }
  
    static async getAnalytics(): Promise<any> {
      const response = await fetch(`${API_BASE_URL}/analytics/summary`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
  
      return response.json();
    }
  }
  
  export type { MedicalCase, PatientDemographics };
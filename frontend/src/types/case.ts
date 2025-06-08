// frontend/src/types/case.ts
export interface PatientDemographics {
    age_range: string;
    gender: string;
  }
  
  export interface MedicalCase {
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
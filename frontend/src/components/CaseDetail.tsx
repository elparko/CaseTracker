import React, { useState, useEffect } from 'react';
import { Save, Edit3, X, Calendar, User, Stethoscope } from 'lucide-react';
import { MedicalCase } from '../types/case';
import { ApiService } from '../services/api';
import { TagsInput } from './TagsInput';

interface CaseDetailProps {
  caseData: MedicalCase;
  onUpdate: (updatedCase: MedicalCase) => void;
  onClose: () => void;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ caseData, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCase, setEditedCase] = useState<MedicalCase>(caseData);
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load available tags when component mounts
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/tags');
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  // Update editedCase when caseData changes
  useEffect(() => {
    setEditedCase(caseData);
  }, [caseData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await ApiService.updateCase(editedCase.id, editedCase);
      onUpdate(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update case:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCase(caseData);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-h-screen overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold">Case Details</h2>
        <div className="flex space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Case Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(caseData.created_at)}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Stethoscope className="w-4 h-4" />
          <span>{caseData.specialty}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{caseData.patient_demographics.age_range}, {caseData.patient_demographics.gender}</span>
        </div>
      </div>

      {/* Case Information */}
      <div className="space-y-6">
        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
          {isEditing ? (
            <textarea
              value={editedCase.summary}
              onChange={(e) => setEditedCase({...editedCase, summary: e.target.value})}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg">
              {caseData.summary || 'No summary available'}
            </div>
          )}
        </div>

        {/* Transcription */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transcription</label>
          {isEditing ? (
            <textarea
              value={editedCase.transcription}
              onChange={(e) => setEditedCase({...editedCase, transcription: e.target.value})}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
              {caseData.transcription}
            </div>
          )}
        </div>

        {/* Key Findings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Key Findings</label>
          {isEditing ? (
            <div className="space-y-2">
              {editedCase.key_findings.map((finding, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={finding}
                    onChange={(e) => {
                      const newFindings = [...editedCase.key_findings];
                      newFindings[index] = e.target.value;
                      setEditedCase({...editedCase, key_findings: newFindings});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const newFindings = editedCase.key_findings.filter((_, i) => i !== index);
                      setEditedCase({...editedCase, key_findings: newFindings});
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditedCase({
                  ...editedCase, 
                  key_findings: [...editedCase.key_findings, '']
                })}
                className="text-blue-500 text-sm hover:underline"
              >
                + Add finding
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {caseData.key_findings.map((finding, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Differential Diagnosis */}
        {(caseData.differential_diagnosis.length > 0 || isEditing) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Differential Diagnosis</label>
            {isEditing ? (
              <div className="space-y-2">
                {editedCase.differential_diagnosis.map((diagnosis, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => {
                        const newDiagnoses = [...editedCase.differential_diagnosis];
                        newDiagnoses[index] = e.target.value;
                        setEditedCase({...editedCase, differential_diagnosis: newDiagnoses});
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        const newDiagnoses = editedCase.differential_diagnosis.filter((_, i) => i !== index);
                        setEditedCase({...editedCase, differential_diagnosis: newDiagnoses});
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setEditedCase({
                    ...editedCase, 
                    differential_diagnosis: [...editedCase.differential_diagnosis, '']
                  })}
                  className="text-blue-500 text-sm hover:underline"
                >
                  + Add diagnosis
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {caseData.differential_diagnosis.map((diagnosis, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{diagnosis}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Learning Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Learning Points</label>
          {isEditing ? (
            <div className="space-y-2">
              {editedCase.learning_points.map((point, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...editedCase.learning_points];
                      newPoints[index] = e.target.value;
                      setEditedCase({...editedCase, learning_points: newPoints});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const newPoints = editedCase.learning_points.filter((_, i) => i !== index);
                      setEditedCase({...editedCase, learning_points: newPoints});
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditedCase({
                  ...editedCase, 
                  learning_points: [...editedCase.learning_points, '']
                })}
                className="text-blue-500 text-sm hover:underline"
              >
                + Add learning point
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {caseData.learning_points.map((point, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Personal Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Personal Notes</label>
          {isEditing ? (
            <textarea
              value={editedCase.notes || ''}
              onChange={(e) => setEditedCase({...editedCase, notes: e.target.value})}
              rows={4}
              placeholder="Add your personal reflections and notes..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg min-h-24">
              {caseData.notes || 'No personal notes added yet'}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          {isEditing ? (
            <TagsInput
              tags={editedCase.tags || []}
              onTagsChange={(newTags) => setEditedCase({...editedCase, tags: newTags})}
              suggestions={availableTags}
              placeholder="Add tags to categorize this case..."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(caseData.tags || []).map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {(!caseData.tags || caseData.tags.length === 0) && (
                <span className="text-gray-500 text-sm">No tags</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
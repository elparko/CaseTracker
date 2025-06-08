import React, { useState, useEffect } from 'react';
import { Search, Calendar, Tag, Heart, Trash2, Eye, Edit3, Save, X, Plus } from 'lucide-react';
import { ApiService, MedicalCase } from '../services/api.ts';
import { TagsInput } from '../components/TagsInput.tsx';

export const Cases: React.FC = () => {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null);
  const [editingCase, setEditingCase] = useState<MedicalCase | null>(null);
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadCases();
    loadTags();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getCases();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const deleteCase = async (caseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        await ApiService.deleteCase(caseId);
        setCases(cases.filter(c => c.id !== caseId));
        if (selectedCase?.id === caseId) {
          setSelectedCase(null);
        }
        if (editingCase?.id === caseId) {
          setEditingCase(null);
        }
      } catch (error) {
        console.error('Failed to delete case:', error);
        alert('Failed to delete case');
      }
    }
  };

  const toggleFavorite = async (caseData: MedicalCase, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const updated = await ApiService.updateCase(caseData.id, {
        is_favorite: !caseData.is_favorite
      });
      setCases(cases.map(c => c.id === caseData.id ? updated : c));
      if (selectedCase?.id === caseData.id) {
        setSelectedCase(updated);
      }
    } catch (error) {
      console.error('Failed to update favorite status:', error);
    }
  };

  const startEditing = (caseData: MedicalCase) => {
    setEditingCase({ ...caseData });
    setSelectedCase(null);
  };

  const saveCase = async () => {
    if (!editingCase) return;
    
    setSaving(true);
    try {
      const updated = await ApiService.updateCase(editingCase.id, editingCase);
      setCases(cases.map(c => c.id === editingCase.id ? updated : c));
      setEditingCase(null);
      setSelectedCase(updated);
      await loadTags(); // Refresh tags in case new ones were added
    } catch (error) {
      console.error('Failed to update case:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingCase(null);
  };

  const addListItem = (field: 'key_findings' | 'differential_diagnosis' | 'learning_points') => {
    if (!editingCase) return;
    setEditingCase({
      ...editingCase,
      [field]: [...editingCase[field], '']
    });
  };

  const updateListItem = (field: 'key_findings' | 'differential_diagnosis' | 'learning_points', index: number, value: string) => {
    if (!editingCase) return;
    const newList = [...editingCase[field]];
    newList[index] = value;
    setEditingCase({
      ...editingCase,
      [field]: newList
    });
  };

  const removeListItem = (field: 'key_findings' | 'differential_diagnosis' | 'learning_points', index: number) => {
    if (!editingCase) return;
    const newList = editingCase[field].filter((_, i) => i !== index);
    setEditingCase({
      ...editingCase,
      [field]: newList
    });
  };

  const filteredCases = cases.filter(caseData => {
    const matchesSearch = 
      caseData.transcription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseData.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseData.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = !filterSpecialty || caseData.specialty === filterSpecialty;
    
    const matchesTags = filterTags.length === 0 || 
      filterTags.some(tag => (caseData.tags || []).includes(tag));
    
    return matchesSearch && matchesSpecialty && matchesTags;
  });

  const specialties = [...new Set(cases.map(c => c.specialty))].filter(Boolean);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Case Editor Component
  if (editingCase) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-semibold">Edit Case</h2>
            <div className="flex space-x-2">
              <button
                onClick={saveCase}
                disabled={saving}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                <select
                  value={editingCase.specialty}
                  onChange={(e) => setEditingCase({...editingCase, specialty: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Specialty</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Emergency Medicine">Emergency Medicine</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Pathology">Pathology</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case Type</label>
                <select
                  value={editingCase.case_type}
                  onChange={(e) => setEditingCase({...editingCase, case_type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="Acute">Acute</option>
                  <option value="Chronic">Chronic</option>
                  <option value="Diagnostic">Diagnostic</option>
                  <option value="Therapeutic">Therapeutic</option>
                  <option value="Procedural">Procedural</option>
                  <option value="Clinical Case">Clinical Case</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
              <textarea
                value={editingCase.summary}
                onChange={(e) => setEditingCase({...editingCase, summary: e.target.value})}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief summary of the case..."
              />
            </div>

            {/* Transcription */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transcription</label>
              <textarea
                value={editingCase.transcription}
                onChange={(e) => setEditingCase({...editingCase, transcription: e.target.value})}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full case transcription..."
              />
            </div>

            {/* Key Findings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Findings</label>
              <div className="space-y-2">
                {editingCase.key_findings.map((finding, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={finding}
                      onChange={(e) => updateListItem('key_findings', index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Key finding..."
                    />
                    <button
                      onClick={() => removeListItem('key_findings', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addListItem('key_findings')}
                  className="text-blue-500 text-sm hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add finding</span>
                </button>
              </div>
            </div>

            {/* Differential Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Differential Diagnosis</label>
              <div className="space-y-2">
                {editingCase.differential_diagnosis.map((diagnosis, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => updateListItem('differential_diagnosis', index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Possible diagnosis..."
                    />
                    <button
                      onClick={() => removeListItem('differential_diagnosis', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addListItem('differential_diagnosis')}
                  className="text-blue-500 text-sm hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add diagnosis</span>
                </button>
              </div>
            </div>

            {/* Learning Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Learning Points</label>
              <div className="space-y-2">
                {editingCase.learning_points.map((point, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateListItem('learning_points', index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Learning point..."
                    />
                    <button
                      onClick={() => removeListItem('learning_points', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addListItem('learning_points')}
                  className="text-blue-500 text-sm hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add learning point</span>
                </button>
              </div>
            </div>

            {/* Personal Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personal Notes</label>
              <textarea
                value={editingCase.notes || ''}
                onChange={(e) => setEditingCase({...editingCase, notes: e.target.value})}
                rows={4}
                placeholder="Add your personal reflections and notes..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <TagsInput
                tags={editingCase.tags || []}
                onTagsChange={(newTags) => setEditingCase({...editingCase, tags: newTags})}
                suggestions={availableTags}
                placeholder="Add tags to categorize this case..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case Detail View  
  if (selectedCase) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-semibold">Case Details</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => startEditing(selectedCase)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedCase.created_at)}</span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Specialty:</strong> {selectedCase.specialty}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Type:</strong> {selectedCase.case_type}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Summary</h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                {selectedCase.summary || 'No summary available'}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Transcription</h3>
              <div className="p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                {selectedCase.transcription}
              </div>
            </div>

            {selectedCase.key_findings.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Key Findings</h3>
                <ul className="space-y-1">
                  {selectedCase.key_findings.map((finding, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCase.differential_diagnosis.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Differential Diagnosis</h3>
                <ul className="space-y-1">
                  {selectedCase.differential_diagnosis.map((diagnosis, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{diagnosis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCase.learning_points.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Learning Points</h3>
                <ul className="space-y-1">
                  {selectedCase.learning_points.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCase.notes && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Personal Notes</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {selectedCase.notes}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedCase.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {(!selectedCase.tags || selectedCase.tags.length === 0) && (
                  <span className="text-gray-500 text-sm">No tags</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Cases List View
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Cases</h1>
        <p className="text-gray-600">Manage and review your medical case collection</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>

          <TagsInput
            tags={filterTags}
            onTagsChange={setFilterTags}
            suggestions={availableTags}
            placeholder="Filter by tags..."
          />
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Cases ({filteredCases.length})</h2>
        
        <div className="space-y-3">
          {filteredCases.map(caseData => (
            <div
              key={caseData.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1" onClick={() => setSelectedCase(caseData)}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {caseData.specialty}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {caseData.case_type}
                    </span>
                    {caseData.complexity && (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                        caseData.complexity === 'high' ? 'bg-red-100 text-red-800' :
                        caseData.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {caseData.complexity}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1 cursor-pointer">
                    {caseData.summary || 'Case Summary'}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 cursor-pointer">
                    {caseData.transcription.substring(0, 150)}...
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(caseData.created_at)}</span>
                    </div>
                    {caseData.tags && caseData.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{caseData.tags.slice(0, 2).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => toggleFavorite(caseData, e)}
                    className={`p-1 rounded ${
                      caseData.is_favorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${caseData.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(caseData);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCase(caseData);
                    }}
                    className="p-1 text-gray-400 hover:text-green-500"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => deleteCase(caseData.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredCases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterSpecialty || filterTags.length > 0 ? 'No cases match your filters' : 'No cases recorded yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
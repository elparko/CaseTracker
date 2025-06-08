// frontend/src/components/CaseList.tsx
import React, { useState, useEffect } from 'react';
import { Search, Calendar, Tag, Heart, Trash2, Eye } from 'lucide-react';
import { MedicalCase } from '../types/case';
import { ApiService } from '../services/api';

interface CaseListProps {
  onCaseSelect: (caseData: MedicalCase) => void;
  refreshTrigger?: number;
}

export const CaseList: React.FC<CaseListProps> = ({ onCaseSelect, refreshTrigger }) => {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');

  useEffect(() => {
    loadCases();
  }, [refreshTrigger]);

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

  const deleteCase = async (caseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        await ApiService.deleteCase(caseId);
        setCases(cases.filter(c => c.id !== caseId));
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
    } catch (error) {
      console.error('Failed to update favorite status:', error);
    }
  };

  const filteredCases = cases.filter(caseData => {
    const matchesSearch = 
      caseData.transcription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseData.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseData.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = !filterSpecialty || caseData.specialty === filterSpecialty;
    
    return matchesSearch && matchesSpecialty;
  });

  const specialties = [...new Set(cases.map(c => c.specialty))].filter(Boolean);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">My Cases ({cases.length})</h2>
      
      {/* Search and Filter */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
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
      </div>

      {/* Cases List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredCases.map(caseData => (
          <div
            key={caseData.id}
            onClick={() => onCaseSelect(caseData)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
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
                
                <h3 className="font-medium text-gray-900 mb-1">
                  {caseData.summary || 'Case Summary'}
                </h3>
                
                <p className="text-sm text-gray-600 line-clamp-2">
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
                  onClick={(e) => onCaseSelect(caseData)}
                  className="p-1 text-gray-400 hover:text-blue-500"
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
            {searchTerm || filterSpecialty ? 'No cases match your filters' : 'No cases recorded yet'}
          </div>
        )}
      </div>
    </div>
  );
};


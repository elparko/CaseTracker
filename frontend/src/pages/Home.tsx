import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiService, MedicalCase } from '../services/api.ts';
import { Mic, FileText, BarChart3, Plus } from 'lucide-react';

export const Home: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analyticsData, casesData] = await Promise.all([
        ApiService.getAnalytics(),
        ApiService.getCases(0, 5) // Get 5 most recent cases
      ]);
      setAnalytics(analyticsData);
      setRecentCases(casesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Record New Case',
      description: 'Start recording a new medical case',
      icon: Mic,
      link: '/record',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View All Cases',
      description: 'Browse your case collection',
      icon: FileText,
      link: '/cases',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Analytics',
      description: 'View your learning progress',
      icon: BarChart3,
      link: '/analytics',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const stats = [
    {
      title: 'Total Cases',
      value: analytics?.total_cases || 0,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Recent Cases',
      value: analytics?.recent_cases || 0,
      icon: Plus,
      color: 'bg-green-500'
    },
    {
      title: 'Specialties',
      value: analytics?.specialty_distribution ? Object.keys(analytics.specialty_distribution).length : 0,
      icon: BarChart3,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
        <p className="text-gray-600">Track your medical cases and monitor your learning progress.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`${action.color} text-white p-4 rounded-lg flex items-center space-x-3 transition-colors`}
              >
                <action.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Cases</h2>
            <Link
              to="/cases"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentCases.map(caseItem => (
              <div key={caseItem.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{caseItem.specialty}</div>
                    <div className="text-gray-600 text-sm">{caseItem.summary}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(caseItem.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {recentCases.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No cases recorded yet.</p>
                <Link
                  to="/record"
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Record your first case
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
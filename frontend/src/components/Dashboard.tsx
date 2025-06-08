 // frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Activity, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { ApiService } from '../services/api';

interface AnalyticsData {
  total_cases: number;
  specialty_distribution: Record<string, number>;
  recent_cases: number;
}

export const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await ApiService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Unable to load analytics data</p>
      </div>
    );
  }

  const specialtyData = Object.entries(analytics.specialty_distribution).map(([specialty, count]) => ({
    specialty,
    count
  }));

  const pieColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const stats = [
    {
      title: 'Total Cases',
      value: analytics.total_cases,
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      title: 'Recent Cases',
      value: analytics.recent_cases,
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Specialties',
      value: Object.keys(analytics.specialty_distribution).length,
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      title: 'This Month',
      value: analytics.recent_cases,
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your medical case collection</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialty Distribution Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Cases by Specialty</h3>
          {specialtyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={specialtyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="specialty" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No specialty data available
            </div>
          )}
        </div>

        {/* Specialty Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Specialty Distribution</h3>
          {specialtyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={specialtyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ specialty, percent }) => `${specialty} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data to display
            </div>
          )}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Most Common Specialty</h4>
            <p className="text-blue-700">
              {specialtyData.length > 0 
                ? specialtyData.reduce((prev, current) => prev.count > current.count ? prev : current).specialty
                : 'No data'
              }
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">Average Cases per Month</h4>
            <p className="text-green-700">
              {analytics.total_cases > 0 ? Math.round(analytics.total_cases / 3) : 0}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900">Learning Progress</h4>
            <p className="text-purple-700">
              {Object.keys(analytics.specialty_distribution).length} specialties covered
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

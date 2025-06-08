import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Activity, BookOpen, TrendingUp, Calendar, Award, Target } from 'lucide-react';
import { ApiService } from '../services/api.ts';

interface AnalyticsData {
  total_cases: number;
  specialty_distribution: Record<string, number>;
  recent_cases: number;
}

export const Analytics: React.FC = () => {
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
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 h-96"></div>
            <div className="bg-white rounded-lg shadow-md p-6 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">Unable to load analytics data</p>
        </div>
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
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Recent Cases',
      value: analytics.recent_cases,
      icon: Calendar,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Specialties',
      value: Object.keys(analytics.specialty_distribution).length,
      icon: Activity,
      color: 'bg-purple-500',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'This Month',
      value: analytics.recent_cases,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  const insights = [
    {
      title: 'Most Active Specialty',
      value: specialtyData.length > 0 
        ? specialtyData.reduce((prev, current) => prev.count > current.count ? prev : current).specialty
        : 'No data',
      icon: Award,
      color: 'bg-blue-50 text-blue-900'
    },
    {
      title: 'Average Cases/Month',
      value: analytics.total_cases > 0 ? Math.round(analytics.total_cases / 3) : 0,
      icon: Target,
      color: 'bg-green-50 text-green-900'
    },
    {
      title: 'Learning Progress',
      value: `${Object.keys(analytics.specialty_distribution).length} specialties covered`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-900'
    }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your learning progress and case collection insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      {/* Insights Cards */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg ${insight.color}`}>
              <div className="flex items-center space-x-3">
                <insight.icon className="w-6 h-6" />
                <div>
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm">{insight.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Goals Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Learning Goals</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Monthly Case Goal</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min((analytics.recent_cases / 20) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{analytics.recent_cases}/20</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Specialty Coverage</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min((Object.keys(analytics.specialty_distribution).length / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{Object.keys(analytics.specialty_distribution).length}/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
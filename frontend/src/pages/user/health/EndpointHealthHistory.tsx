// src/pages/user/health/EndpointHealthHistory.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart2,
  TrendingUp
} from 'lucide-react';
import { getEndpointHistory, getEndpointStats, triggerManualCheck,getEndpointById } from '../../../api/userAction/userAction';
import ResponseTimeChart from '../../../component/userComponent/ResponseTimeChart';
import RecentChecksTable from '../../../component/userComponent/RecentChecksTable';
import UptimeGauge from '../../../component/userComponent/UptimeGauge';
import type { ApiEndpoint } from '../../../types/interface/apiInterface';
import type {HealthCheck, EndpointStats} from '../../../types/interface/healthCheckInterface'

// Loading Spinner Component
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
        {icon}
      </div>
    </div>
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-xl font-bold text-gray-900">{value}</p>
  </div>
);

const timeRanges = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
] as const;

const EndpointHealthHistory: React.FC = () => {
  const { endpointId } = useParams<{ endpointId: string }>();
  const navigate = useNavigate();
  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null);
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [stats, setStats] = useState<EndpointStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!endpointId) return;
    
    try {
      setRefreshing(true);
      
      // Convert timeRange to hours for API
      const hoursMap = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
      };
      
      const [endpointData, historyData, statsData] = await Promise.all([
        getEndpointById(endpointId),
        getEndpointHistory(endpointId, 500),
        getEndpointStats(endpointId, hoursMap[timeRange])
      ]);
      
      setEndpoint(endpointData);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpointId, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleManualCheck = async () => {
    if (!endpointId) return;
    
    try {
      await triggerManualCheck(endpointId);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to trigger manual check:', error);
    }
  };

  const handleExportCSV = () => {
    const csvData = history.map(check => ({
      Time: new Date(check.checkedAt).toLocaleString(),
      Status: check.status,
      'Response Time (ms)': check.responseTime,
      'Status Code': check.statusCode || '',
      Error: check.errorMessage || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-history-${endpointId}-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!endpoint || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load health data for this endpoint.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const successRate = (stats.successCount / stats.totalChecks * 100).toFixed(2);
  const failureRate = (stats.failureCount / stats.totalChecks * 100).toFixed(2);
  const timeoutRate = (stats.timeoutCount / stats.totalChecks * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{endpoint.name}</h1>
              <p className="text-gray-600 mt-1">Health Monitoring History</p>
            </div>
            
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                disabled={history.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={handleManualCheck}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Check Now
              </button>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Time Range:</span>
            </div>
            <div className="flex space-x-2">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    timeRange === range.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="Total Checks"
            value={stats.totalChecks}
            icon={<BarChart2 className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            label="Avg Response"
            value={`${Math.round(stats.avgResponseTime)}ms`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Success Rate"
            value={`${successRate}%`}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Failure Rate"
            value={`${failureRate}%`}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            label="Timeout Rate"
            value={`${timeoutRate}%`}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600">Success</span>
                  <span className="font-medium">{stats.successCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(stats.successCount / stats.totalChecks) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600">Failure</span>
                  <span className="font-medium">{stats.failureCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(stats.failureCount / stats.totalChecks) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-orange-600">Timeout</span>
                  <span className="font-medium">{stats.timeoutCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${(stats.timeoutCount / stats.totalChecks) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Uptime</span>
                <span className="text-lg font-bold text-gray-900">{stats.uptime.toFixed(2)}%</span>
              </div>
              <UptimeGauge uptime={stats.uptime} size="md" />
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trend</h3>
            <ResponseTimeChart data={history} timeRange={timeRange} height={350} />
          </div>
        </div>

        {/* Recent Checks Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Checks</h3>
          </div>
          <RecentChecksTable checks={history.slice(0, 50)} />
          
          {history.length > 50 && (
            <div className="px-6 py-4 border-t border-gray-200 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All {history.length} Checks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndpointHealthHistory;
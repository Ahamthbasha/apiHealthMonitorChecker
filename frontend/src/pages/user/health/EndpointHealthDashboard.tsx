// src/pages/user/health/EndpointHealthDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Eye,
  Play
} from 'lucide-react';
import { getUserEndpointsStatus, getEndpointStats, triggerManualCheck } from '../../../api/userAction/userAction';
import HealthStatusBadge from '../../../component/userComponent/HealthStatusBadge';
import UptimeGauge from '../../../component/userComponent/UptimeGauge';
import { type EndpointStatus, type EndpointStats } from '../../../types/interface/healthCheckInterface';

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

// Alert Component
const Alert: React.FC<{ type: 'error' | 'success' | 'info' | 'warning'; message: string }> = ({ type, message }) => {
  const bgColors = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className={`mb-4 p-4 rounded-lg border ${bgColors[type]}`}>
      {message}
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}> = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const EndpointHealthDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<EndpointStatus[]>([]);
  const [stats, setStats] = useState<Record<string, EndpointStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const statusData = await getUserEndpointsStatus();
      setStatuses(statusData);
      
      // Fetch stats for each endpoint
      const statsPromises = statusData.map(s => 
        getEndpointStats(s.endpointId, 24).catch(() => null)
      );
      const statsResults = await Promise.all(statsPromises);
      
      const statsMap: Record<string, EndpointStats> = {};
      statusData.forEach((s, index) => {
        if (statsResults[index]) {
          statsMap[s.endpointId] = statsResults[index]!;
        }
      });
      
      setStats(statsMap);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch health data');
      console.error('Health data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleManualCheck = async (endpointId: string) => {
    try {
      await triggerManualCheck(endpointId);
      await fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to trigger manual check');
      console.error('Manual check error:', err);
    }
  };

  const calculateOverallMetrics = () => {
    const total = statuses.length;
    const up = statuses.filter(s => s.status === 'up').length;
    const degraded = statuses.filter(s => s.status === 'degraded').length;
    const down = statuses.filter(s => s.status === 'down').length;
    
    const avgResponseTime = statuses.reduce((acc, s) => acc + s.responseTime, 0) / total || 0;
    const avgUptime = statuses.reduce((acc, s) => acc + s.uptime, 0) / total || 100;
    
    return { total, up, degraded, down, avgResponseTime, avgUptime };
  };

  const metrics = calculateOverallMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Real-time status of all your API endpoints
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* Last Updated */}
        <div className="mb-4 text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatsCard
            title="Total Endpoints"
            value={metrics.total}
            icon={<Activity className="w-6 h-6" />}
            color="blue"
          />
          <StatsCard
            title="Operational"
            value={metrics.up}
            icon={<Activity className="w-6 h-6" />}
            color="green"
          />
          <StatsCard
            title="Degraded"
            value={metrics.degraded}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="yellow"
          />
          <StatsCard
            title="Down"
            value={metrics.down}
            icon={<Activity className="w-6 h-6" />}
            color="red"
          />
          <StatsCard
            title="Avg Response"
            value={`${Math.round(metrics.avgResponseTime)}ms`}
            icon={<BarChart2 className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Endpoints Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statuses.map((status) => (
            <div
              key={status.endpointId}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{status.name}</h3>
                  <p className="text-sm text-gray-600 truncate" title={status.url}>
                    {status.url}
                  </p>
                </div>
                <HealthStatusBadge status={status.status} />
              </div>

              <div className="flex items-center justify-between mb-4">
                <UptimeGauge uptime={status.uptime} size="sm" />
                <div className="text-right">
                  <div className="text-sm text-gray-600">Response Time</div>
                  <div className={`text-lg font-semibold ${
                    status.responseTime > 1000 ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                    {status.responseTime}ms
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600">Last check:</span>
                  <span className="text-gray-900">
                    {status.lastChecked ? new Date(status.lastChecked).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                
                {stats[status.endpointId] && (
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">24h checks:</span>
                      <span className="ml-1 font-medium">{stats[status.endpointId].totalChecks}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Success:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {stats[status.endpointId].successCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Failures:</span>
                      <span className="ml-1 font-medium text-red-600">
                        {stats[status.endpointId].failureCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timeouts:</span>
                      <span className="ml-1 font-medium text-orange-600">
                        {stats[status.endpointId].timeoutCount}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/endpoints/${status.endpointId}`)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </button>
                  <button
                    onClick={() => handleManualCheck(status.endpointId)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Check Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {statuses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints to monitor</h3>
            <p className="text-gray-600 mb-6">
              Create your first API endpoint to start monitoring
            </p>
            <button
              onClick={() => navigate('/endpoints/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Endpoint
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointHealthDashboard;
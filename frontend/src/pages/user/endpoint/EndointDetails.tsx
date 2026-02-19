// src/pages/user/endpoint/EndpointDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Power,
  Trash2,
  Globe,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart2,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
} from 'lucide-react';
import { getEndpointById, toggleEndpoint, deleteEndpoint } from '../../../api/userAction/userAction'
import type { ApiEndpoint } from '../../../types/interface/apiInterface'
import StatusBadge from '../../../component/userComponent/StatusBadge'; 
import ConfirmationModal from '../../../component/common/ConfirmationModal'; 
import { formatDistanceToNow, format } from 'date-fns';

// Simple Loading Spinner Component
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

// Simple Metrics Chart Component (Placeholder)
const MetricsChart: React.FC<{ timeRange: '1h' | '24h' | '7d' | '30d' }> = ({ timeRange }) => {
  // This is a placeholder chart component
  // In a real application, you would integrate a charting library like recharts or chart.js
  const getTimeRangeText = () => {
    switch (timeRange) {
      case '1h': return 'last hour';
      case '24h': return 'last 24 hours';
      case '7d': return 'last 7 days';
      case '30d': return 'last 30 days';
      default: return 'selected period';
    }
  };

  return (
    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
      <div className="text-center">
        <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 mb-2">Response Time Chart</p>
        <p className="text-sm text-gray-400">Showing data from {getTimeRangeText()}</p>
        <p className="text-xs text-gray-400 mt-4">Integrate with recharts, chart.js, or your preferred charting library</p>
      </div>
    </div>
  );
};

const EndpointDetails: React.FC = () => {
  const { endpointId } = useParams<{ endpointId: string }>();
  const navigate = useNavigate();
  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const fetchEndpoint = useCallback(async () => {
    if (!endpointId) return;
    
    try {
      setLoading(true);
      const data = await getEndpointById(endpointId);
      setEndpoint(data);
    } catch (error) {
      console.error('Failed to fetch endpoint:', error);
    } finally {
      setLoading(false);
    }
  }, [endpointId]);

  useEffect(() => {
    fetchEndpoint();
  }, [fetchEndpoint]);

  const handleToggle = async () => {
    if (!endpoint) return;
    
    try {
      setToggling(true);
      await toggleEndpoint(endpoint._id);
      await fetchEndpoint();
    } catch (error) {
      console.error('Failed to toggle endpoint:', error);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!endpoint) return;
    
    try {
      await deleteEndpoint(endpoint._id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Endpoint Not Found</h2>
          <p className="text-gray-600 mb-6">The endpoint you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const uptimePercentage = 99.95; // This would come from your API
  const averageResponseTime = 245; // This would come from your API
  const totalChecks = 15234; // This would come from your API
  const failures = 8; // This would come from your API

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{endpoint.name}</h1>
                <div className="flex items-center mt-1 space-x-2">
                  <StatusBadge isActive={endpoint.isActive} />
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(endpoint.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                onClick={() => navigate(`/endpoints/${endpoint._id}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  endpoint.isActive
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50 transition-colors`}
              >
                <Power className="w-4 h-4 mr-2" />
                {toggling ? 'Processing...' : endpoint.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setDeleteModal(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{uptimePercentage}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{averageResponseTime}ms</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900">{totalChecks.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failures</p>
                <p className="text-2xl font-bold text-gray-900">{failures}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Response Time History</h2>
            <div className="flex space-x-2">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <MetricsChart timeRange={timeRange} />
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Endpoint Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              Endpoint Details
            </h2>
            <dl className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">URL</dt>
                <dd className="text-sm text-gray-900 flex items-center">
                  <span className="truncate max-w-xs">{endpoint.url}</span>
                  <button
                    onClick={() => copyToClipboard(endpoint.url)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </dd>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">Method</dt>
                <dd>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      endpoint.method === 'GET'
                        ? 'bg-green-100 text-green-800'
                        : endpoint.method === 'POST'
                        ? 'bg-blue-100 text-blue-800'
                        : endpoint.method === 'PUT'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">Expected Status</dt>
                <dd className="text-sm text-gray-900">{endpoint.expectedStatus}</dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">Check Interval</dt>
                <dd className="text-sm text-gray-900">{endpoint.interval / 60} minutes</dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">Timeout</dt>
                <dd className="text-sm text-gray-900">{endpoint.timeout}ms</dd>
              </div>

              <div className="flex justify-between py-2">
                <dt className="text-sm font-medium text-gray-600">Created</dt>
                <dd className="text-sm text-gray-900">
                  {format(new Date(endpoint.createdAt), 'PPP')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Thresholds */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Alert Thresholds
            </h2>
            <dl className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">Max Response Time</dt>
                <dd className="text-sm text-gray-900">{endpoint.thresholds.maxResponseTime}ms</dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">Failure Threshold</dt>
                <dd className="text-sm text-gray-900">{endpoint.thresholds.failureThreshold} failures</dd>
              </div>

              <div className="flex justify-between py-2">
                <dt className="text-sm font-medium text-gray-600">Current Status</dt>
                <dd>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Healthy
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Headers */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <button
              onClick={() => setShowHeaders(!showHeaders)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Headers
              </h2>
              {showHeaders ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {showHeaders && (
              <div className="mt-4 space-y-2">
                {endpoint.headers && Object.keys(endpoint.headers).length > 0 ? (
                  Object.entries(endpoint.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 w-1/3">{key}:</span>
                      <span className="text-sm text-gray-900 font-mono flex-1">{String(value)}</span>
                      <button
                        onClick={() => copyToClipboard(String(value))}
                        className="ml-2 p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No headers configured</p>
                )}
              </div>
            )}
          </div>

          {/* Request Body */}
          {endpoint.body && (
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
                Request Body
              </h2>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(endpoint.body), null, 2);
                  } catch {
                    return endpoint.body;
                  }
                })()}
              </pre>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Endpoint"
        message={`Are you sure you want to delete "${endpoint.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default EndpointDetails;
// src/pages/user/Dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserEndpoints, toggleEndpoint, deleteEndpoint } from '../../../api/userAction/userAction'
import type { ApiEndpoint } from '../../../types/interface/apiInterface'
import StatusBadge from '../../../component/userComponent/StatusBadge';
import MetricsCard from '../../../component/userComponent/MetricsCard'; 
import ConfirmationModal from '../../../component/common/ConfirmationModal'; 
import { formatDistanceToNow } from 'date-fns';

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

const Dashboard: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [filteredEndpoints, setFilteredEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; endpointId: string | null }>({
    isOpen: false,
    endpointId: null,
  });
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const data = await getUserEndpoints();
      setEndpoints(data);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEndpoints = useCallback(() => {
    let filtered = endpoints;

    if (searchTerm) {
      filtered = filtered.filter(
        (ep) =>
          ep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ep.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter((ep) => ep.method === methodFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((ep) => 
        statusFilter === 'active' ? ep.isActive : !ep.isActive
      );
    }

    setFilteredEndpoints(filtered);
  }, [endpoints, searchTerm, methodFilter, statusFilter]);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    filterEndpoints();
  }, [filterEndpoints]);

  const handleToggle = async (endpointId: string) => {
    try {
      setTogglingId(endpointId);
      await toggleEndpoint(endpointId);
      await fetchEndpoints();
    } catch (error) {
      console.error('Failed to toggle endpoint:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.endpointId) return;
    
    try {
      await deleteEndpoint(deleteModal.endpointId);
      await fetchEndpoints();
      setDeleteModal({ isOpen: false, endpointId: null });
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
    }
  };

  const getStatusCounts = () => {
    const total = endpoints.length;
    const active = endpoints.filter((ep) => ep.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  };

  const counts = getStatusCounts();

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
            <h1 className="text-2xl font-bold text-gray-900">API Endpoints</h1>
            <p className="text-gray-600 mt-1">Monitor and manage your API endpoints</p>
          </div>
          <Link
            to="/endpoints/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Endpoint
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Endpoints"
            value={counts.total}
            icon={<Activity className="w-6 h-6" />}
            color="blue"
          />
          <MetricsCard
            title="Active"
            value={counts.active}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          <MetricsCard
            title="Inactive"
            value={counts.inactive}
            icon={<XCircle className="w-6 h-6" />}
            color="gray"
          />
          <MetricsCard
            title="Avg Response Time"
            value="245ms"
            icon={<Clock className="w-6 h-6" />}
            color="purple"
            trend={{ value: 12, isPositive: true }}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Endpoints List */}
        {filteredEndpoints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints found</h3>
            <p className="text-gray-600 mb-6">
              {endpoints.length === 0
                ? "You haven't created any endpoints yet."
                : 'No endpoints match your filters.'}
            </p>
            {endpoints.length === 0 && (
              <Link
                to="/endpoints/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create your first endpoint
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interval
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Check
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEndpoints.map((endpoint) => (
                    <tr
                      key={endpoint._id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/endpoints/${endpoint._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge isActive={endpoint.isActive} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{endpoint.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(endpoint.updatedAt), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                        {endpoint.url}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {endpoint.interval / 60}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDistanceToNow(new Date(endpoint.updatedAt), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">245ms</span>
                          <span className="ml-2 text-xs text-green-600">✓ 99.5%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggle(endpoint._id)}
                            disabled={togglingId === endpoint._id}
                            className={`p-1 rounded-lg transition-colors ${
                              endpoint.isActive
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={endpoint.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === endpoint._id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Power className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => navigate(`/endpoints/${endpoint._id}/edit`)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, endpointId: endpoint._id })}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, endpointId: null })}
        onConfirm={handleDelete}
        title="Delete Endpoint"
        message="Are you sure you want to delete this endpoint? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Dashboard;
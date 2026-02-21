import React from 'react';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter
} from 'lucide-react';
import type { HealthCheckDTO } from '../../../types/interface/healthCheckInterface';
import type { HealthChecksTableProps } from './IHealthChecksTable';


const StatusBadge: React.FC<{ status: HealthCheckDTO['status'] }> = ({ status }) => {
  const config = {
    success: { 
      label: 'Success', 
      cls: 'bg-green-500/10 text-green-400 border-green-500/20',
      icon: <CheckCircle className="w-3 h-3" />
    },
    failure: { 
      label: 'Failure', 
      cls: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: <XCircle className="w-3 h-3" />
    },
    timeout: { 
      label: 'Timeout', 
      cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      icon: <AlertCircle className="w-3 h-3" />
    },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-bold rounded border ${config.cls}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const HealthChecksTable: React.FC<HealthChecksTableProps> = ({
  checks = [],
  total,
  page,
  totalPages,
  limit,
  statusFilter,
  onPageChange,
  onLimitChange,
  onStatusFilterChange,
  loading = false,
  error = null,
  endpointName,
  className = '',
  showEndpointInfo = false
}) => {
  const formatDateTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // Add this instead:
const getResponseTimeColor = (status: HealthCheckDTO['status']): string => {
  if (status === 'success') return 'text-green-400';
  if (status === 'timeout') return 'text-yellow-400';
  return 'text-red-400';
};

  const getStatusCodeColor = (code?: number): string => {
    if (!code) return 'text-gray-600';
    if (code >= 200 && code < 300) return 'text-green-400';
    if (code >= 400) return 'text-red-400';
    return 'text-yellow-400';
  };

  // Helper function to safely get endpoint name
  const getEndpointName = (endpointId: string | { name?: string }): string => {
    if (typeof endpointId === 'object' && endpointId !== null) {
      return endpointId.name || 'Unknown';
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className={`bg-gray-900/50 border border-gray-700/50 rounded-xl p-12 ${className}`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
          <p className="mt-4 text-gray-400">Loading health checks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-900/50 border border-gray-700/50 rounded-xl p-12 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400">Error loading health checks: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Health Check History</h3>
            {endpointName && showEndpointInfo && (
              <span className="text-sm text-gray-500 ml-2">- {endpointName}</span>
            )}
            <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-400">
              Total: {total}
            </span>
          </div>

          {/* Status Filter Only */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="timeout">Timeout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/30 bg-gray-800/20">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Message</th>
              {showEndpointInfo && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {checks.length > 0 ? (
              checks.map((check) => (
                <tr key={check.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <StatusBadge status={check.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300 font-mono">
                      {check.formattedDateTime || formatDateTime(check.checkedAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    // To this:
<span className={`text-sm font-mono font-semibold ${getResponseTimeColor(check.status)}`}>
  {check.responseTime}ms
</span>
                  </td>
                  <td className="px-6 py-4">
                    {check.statusCode ? (
                      <span className={`text-sm font-mono ${getStatusCodeColor(check.statusCode)}`}>
                        {check.statusCode}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 max-w-xs truncate block" title={check.errorMessage}>
                      {check.errorMessage || <span className="text-gray-700">—</span>}
                    </span>
                  </td>
                  {showEndpointInfo && check.endpointId && (
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {getEndpointName(check.endpointId)}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={showEndpointInfo ? 6 : 5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center text-gray-500">
                    <Filter className="w-12 h-12 mb-3 text-gray-600" />
                    <p>No health checks found</p>
                    {statusFilter !== 'all' && (
                      <button
                        onClick={() => onStatusFilterChange('all')}
                        className="mt-2 text-sm text-green-400 hover:text-green-300"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-300">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-medium text-gray-300">
                {Math.min(page * limit, total)}
              </span>{' '}
              of <span className="font-medium text-gray-300">{total}</span> results
            </div>

            <div className="flex items-center gap-2">
              {onLimitChange && (
                <select
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-green-500"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPageChange(totalPages)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthChecksTable;
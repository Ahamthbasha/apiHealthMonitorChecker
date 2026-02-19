// src/component/userComponent/RecentChecksTable.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import {type HealthCheck } from '../../types/interface/healthCheckInterface';

interface RecentChecksTableProps {
  checks: HealthCheck[];
  onViewDetails?: (checkId: string) => void;
}

const RecentChecksTable: React.FC<RecentChecksTableProps> = ({ checks, onViewDetails }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'timeout':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      timeout: 'bg-orange-100 text-orange-800'
    };
    
    return config[status as keyof typeof config] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Response Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Error
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {checks.map((check) => (
            <tr key={check._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getStatusIcon(check.status)}
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(check.status)}`}>
                    {check.status}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {formatDistanceToNow(new Date(check.checkedAt), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-medium ${
                  check.responseTime > 1000 ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {check.responseTime}ms
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {check.statusCode || '-'}
              </td>
              <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-600">
                {check.errorMessage || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(check._id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentChecksTable;
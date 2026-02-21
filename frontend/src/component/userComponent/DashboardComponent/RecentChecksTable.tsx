
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { type HealthCheck } from '../../../types/healthCheck';
import type { RecentChecksTableProps } from './interface/IRecentChecksTable';

const StatusBadge: React.FC<{ status: HealthCheck['status'] }> = ({ status }) => {
  const config = {
    success: { label: 'OK', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    failure: { label: 'FAIL', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    timeout: { label: 'TIMEOUT', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  }[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold rounded border ${config.cls}`}>
      {config.label}
    </span>
  );
};

function extractTime(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString();
    }
    // Format: "19/02/2026, 08:10:31 pm"
    const [, timePart] = dateStr.split(', ');
    return timePart || '-';
  } catch {
    return '-';
  }
}

const RecentChecksTable: React.FC<RecentChecksTableProps> = ({ history, onViewAll }) => {
  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Recent Checks</h3>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
        >
          View All <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/30">
              {['Status', 'Time', 'Response', 'Status Code', 'Error'].map((h) => (
                <th
                  key={h}
                  className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {history.slice(0, 10).map((check) => (
              <tr key={check.id} className="hover:bg-gray-700/20 transition-colors">
                <td className="px-5 py-3">
                  <StatusBadge status={check.status} />
                </td>
                <td className="px-5 py-3 text-sm text-gray-400 font-mono">
                  {extractTime(check.checkedAt)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-sm font-mono font-semibold ${
                      check.responseTime < 300
                        ? 'text-green-400'
                        : check.responseTime < 1000
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {check.responseTime}ms
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-400 font-mono">
                  {check.statusCode ? (
                    <span
                      className={
                        check.statusCode >= 200 && check.statusCode < 300
                          ? 'text-green-400'
                          : check.statusCode >= 400
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }
                    >
                      {check.statusCode}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate">
                  {check.errorMessage || <span className="text-gray-700">—</span>}
                </td>
              </tr>
            ))}

            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">
                  No checks recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentChecksTable;
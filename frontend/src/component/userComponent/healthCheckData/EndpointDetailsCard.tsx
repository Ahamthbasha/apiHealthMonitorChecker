
import React from 'react';
import { 
  Activity, 
  Globe, 
  Hash, 
  Clock, 
  Gauge, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Power,
  Edit,
  Trash2,
  Play
} from 'lucide-react';
import type { EndpointDetailsCardProps } from './IEndpointDetailsCard';

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
        : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
    }`}>
      {isActive ? (
        <>
          <CheckCircle className="w-3 h-3" />
          <span>Active</span>
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          <span>Inactive</span>
        </>
      )}
    </span>
  );
};

const InfoItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueColor?: string;
}> = ({ icon, label, value, valueColor = 'text-gray-200' }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
    <div className="text-gray-500 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium truncate ${valueColor}`}>{value}</p>
    </div>
  </div>
);

const EndpointDetailsCard: React.FC<EndpointDetailsCardProps> = ({
  endpoint,
  onEdit,
  onDelete,
  onManualCheck,
  onToggle,
  className = ''
}) => {
  const methodColors = {
    GET: 'text-green-400 bg-green-500/10 border-green-500/30',
    POST: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    PUT: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    DELETE: 'text-red-400 bg-red-500/10 border-red-500/30'
  }[endpoint.method] || 'text-gray-400 bg-gray-500/10 border-gray-500/30';

  return (
    <div className={`bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white truncate">{endpoint.name}</h2>
              <StatusBadge isActive={endpoint.isActive} />
              <span className={`px-2 py-0.5 text-xs font-mono font-semibold rounded border ${methodColors}`}>
                {endpoint.method}
              </span>
            </div>
            <a 
              href={endpoint.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 truncate max-w-full"
            >
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{endpoint.url}</span>
            </a>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onManualCheck && endpoint.isActive && (
              <button
                onClick={onManualCheck}
                className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                title="Manual Check"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {onToggle && (
              <button
                onClick={onToggle}
                className={`p-2 rounded-lg transition-colors ${
                  endpoint.isActive 
                    ? 'bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400' 
                    : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'
                }`}
                title={endpoint.isActive ? 'Pause' : 'Resume'}
              >
                <Power className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoItem
            icon={<Hash className="w-4 h-4" />}
            label="Expected Status"
            value={endpoint.expectedStatus}
            valueColor="text-blue-400"
          />
          
          <InfoItem
            icon={<Clock className="w-4 h-4" />}
            label="Check Interval"
            value={`${endpoint.interval} seconds`}
            valueColor="text-purple-400"
          />
          
          <InfoItem
            icon={<Gauge className="w-4 h-4" />}
            label="Timeout"
            value={`${endpoint.timeout}ms`}
            valueColor="text-orange-400"
          />
          
          <InfoItem
            icon={<Activity className="w-4 h-4" />}
            label="Max Response Time"
            value={`${endpoint.thresholds?.maxResponseTime || 5000}ms`}
            valueColor="text-yellow-400"
          />
        </div>

        {/* Thresholds Section */}
        {endpoint.thresholds && (
          <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-400">Thresholds</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Failure Threshold:</span>
                <span className="text-sm font-mono text-red-400">
                  {endpoint.thresholds.failureThreshold} failures
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Max Response Time:</span>
                <span className="text-sm font-mono text-yellow-400">
                  {endpoint.thresholds.maxResponseTime}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Headers Section */}
        {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
          <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Headers</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(endpoint.headers).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-500 font-mono">{key}:</span>
                  <span className="text-gray-300 font-mono break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body Section */}
        {endpoint.body && (
          <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Request Body</h3>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
              {endpoint.body}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointDetailsCard;
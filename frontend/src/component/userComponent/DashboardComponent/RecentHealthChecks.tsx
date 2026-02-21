import React from "react";
import { Clock, AlertCircle, CheckCircle, XCircle, Pause } from "lucide-react";
import type { HealthCheckDTO } from "../../../types/interface/healthCheckInterface";
import type { RecentHealthChecksProps } from "./interface/IRecentHealthChecks";

const StatusBadge: React.FC<{ status: HealthCheckDTO["status"]; isPaused?: boolean }> = ({
  status,
  isPaused,
}) => {
  const config = {
    success: {
      label: "OK",
      cls: "bg-green-500/10 text-green-400 border-green-500/20",
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
    },
    failure: {
      label: "FAIL",
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: <XCircle className="w-3 h-3 mr-1" />,
    },
    timeout: {
      label: "TIMEOUT",
      cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      icon: <AlertCircle className="w-3 h-3 mr-1" />,
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold rounded border ${config.cls} ${isPaused ? 'opacity-60' : ''}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

const RecentHealthChecks: React.FC<RecentHealthChecksProps> = ({
  checks = [],
  loading = false,
  error = null,
  endpointName,
  isActive = true,
  className = "",
}) => {
  if (loading) {
    return (
      <div
        className={`bg-gray-800/30 border border-gray-700/50 rounded-xl p-8 ${className}`}
      >
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          <span className="ml-3 text-gray-400">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-gray-800/30 border border-gray-700/50 rounded-xl p-8 ${className}`}
      >
        <div className="text-center text-red-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p>Error loading history: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-gray-500'}`} />
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            Recent Logs
          </h3>
          {!isActive && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-700 text-amber-400 text-xs rounded-full border border-amber-500/30">
              <Pause className="w-3 h-3" />
              Paused
            </span>
          )}
          <span className="text-xs text-gray-500">
            (Last {checks.length} checks)
          </span>
        </div>

        {/* Endpoint Info */}
        {endpointName && (
          <div className="text-xs text-gray-500">
            <span className="font-mono">{endpointName}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/30">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status Code
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {checks.length > 0 ? (
              checks.map((check) => (
                <tr
                  key={check.id}
                  className={`hover:bg-gray-700/20 transition-colors ${!isActive ? 'opacity-70' : ''}`}
                >
                  <td className="px-5 py-3">
                    <StatusBadge status={check.status} isPaused={!isActive} />
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-400 font-mono">
                      {check.formattedDateTime || check.formattedTime}
                    </span>
                    {!isActive && (
                      <span className="ml-2 text-xs text-gray-600">(Historical)</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-sm font-mono font-semibold ${
                        !isActive
                          ? "text-gray-500"
                          : check.status === "success"
                            ? "text-green-400"
                            : check.status === "timeout"
                              ? "text-yellow-400"
                              : "text-red-400"
                      }`}
                    >
                      {check.responseTime}ms
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {check.statusCode ? (
                      <span
                        className={`text-sm font-mono ${
                          !isActive
                            ? "text-gray-500"
                            : check.statusCode >= 200 && check.statusCode < 300
                              ? "text-green-400"
                              : check.statusCode >= 400
                                ? "text-red-400"
                                : "text-yellow-400"
                        }`}
                      >
                        {check.statusCode}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-sm text-gray-500 max-w-xs truncate block"
                      title={check.errorMessage}
                    >
                      {check.errorMessage || (
                        <span className="text-gray-700">—</span>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-gray-500 text-sm"
                >
                  {!isActive ? (
                    <div className="flex flex-col items-center gap-2">
                      <Pause className="w-8 h-8 text-gray-600" />
                      <p>No health checks recorded yet for this endpoint</p>
                      <p className="text-xs text-gray-600">Resume monitoring to start receiving checks</p>
                    </div>
                  ) : (
                    "No health checks recorded yet for this endpoint"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentHealthChecks;
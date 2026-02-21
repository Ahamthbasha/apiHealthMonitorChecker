
import React from 'react';
import type { TimeRange } from '../../../types/healthCheck';
import type { StatsBarProps } from './interface/IStatsbar';


const StatItem: React.FC<{
  label: string;
  sublabel: string;
  value: string | number;
  unit?: string;
  color?: string;
}> = ({ label, sublabel, value, unit, color = 'text-white' }) => (
  <div className="text-center px-3 py-3">
    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-widest mb-0.5 truncate">
      {label}
    </p>
    <p className="text-[10px] text-gray-600 mb-1.5 truncate">({sublabel})</p>
    <p className={`text-base sm:text-2xl font-bold font-mono ${color}`}>
      {value}
      {unit && <span className="text-sm font-medium ml-0.5 text-gray-400">{unit}</span>}
    </p>
  </div>
);

const StatsBar: React.FC<StatsBarProps> = ({ stats, timeRange, onTimeRangeChange }) => {
  const timeRanges: TimeRange[] = ['1h', '24h', '7d', '30d'];

  const uptimeColor = !stats.isActive 
    ? 'text-gray-400'
    : stats.uptime >= 99 ? 'text-green-400' 
      : stats.uptime >= 95 ? 'text-yellow-400' 
        : 'text-red-400';

  // Determine color for current response based on status and active state
  const responseColor = !stats.isActive 
    ? 'text-gray-400'
    : stats.latestStatus === 'success' ? 'text-green-400' 
      : stats.latestStatus === 'failure' ? 'text-red-400' 
        : stats.latestStatus === 'timeout' ? 'text-yellow-400' 
          : 'text-blue-400';

  // Use latestResponseTime if available and endpoint is active, otherwise show placeholder
  const currentResponseTime = !stats.isActive 
    ? '—' 
    : (stats.latestResponseTime !== undefined 
      ? Math.round(stats.latestResponseTime) 
      : Math.round(stats.avgResponseTime));

  const items = [
    { 
      label: 'Current', 
      sublabel: 'Response', 
      value: currentResponseTime, 
      unit: 'ms', 
      color: responseColor
    },
    { 
      label: 'Avg Response', 
      sublabel: timeRange, 
      value: !stats.isActive ? '—' : `${Math.round(stats.avgResponseTime)}`, 
      unit: 'ms', 
      color: !stats.isActive ? 'text-gray-400' : 'text-blue-400' 
    },
    { 
      label: 'Uptime', 
      sublabel: timeRange, 
      value: !stats.isActive ? '—' : `${stats.uptime.toFixed(2)}%`, 
      color: uptimeColor 
    },
    {
      label: 'Success', 
      sublabel: 'checks',
      value: !stats.isActive ? '—' : stats.successCount,
      color: !stats.isActive ? 'text-gray-400' : 'text-green-400',
    },
    { 
      label: 'Failures', 
      sublabel: `${stats.failureCount} checks`, 
      value: !stats.isActive ? '—' : stats.failureCount, 
      color: !stats.isActive ? 'text-gray-400' : (stats.failureCount > 0 ? 'text-red-400' : 'text-gray-500') 
    },
    { 
      label: 'Timeouts', 
      sublabel: `${stats.timeoutCount} checks`, 
      value: !stats.isActive ? '—' : stats.timeoutCount, 
      color: !stats.isActive ? 'text-gray-400' : (stats.timeoutCount > 0 ? 'text-yellow-400' : 'text-gray-500') 
    },
  ];

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Time range selector */}
      <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-gray-700/30">
        {timeRanges.map((r) => (
          <button
            key={r}
            onClick={() => onTimeRangeChange(r)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              timeRange === r ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-700/40">
        {items.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
};

export default StatsBar;
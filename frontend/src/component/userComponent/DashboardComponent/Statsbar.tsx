import React from 'react';
import type { TimeRange } from '../../../types/healthCheck';
import type { StatsBarProps } from './interface/IStatsbar';

const StatItem: React.FC<{
  label: string;
  sublabel: string;
  value: string | number;
  unit?: string;
  color?: string;
  isPaused?: boolean;
}> = ({ label, sublabel, value, unit, color = 'text-white', isPaused }) => (
  <div className="text-center px-3 py-3">
    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-widest mb-0.5 truncate">
      {label}
    </p>
    <p className="text-[10px] text-gray-600 mb-1.5 truncate">({sublabel})</p>
    <p className={`text-base sm:text-2xl font-bold font-mono ${isPaused ? 'text-gray-400' : color}`}>
      {value}
      {unit && <span className="text-sm font-medium ml-0.5 text-gray-400">{unit}</span>}
    </p>
  </div>
);

const StatsBar: React.FC<StatsBarProps> = ({ stats, timeRange, onTimeRangeChange }) => {
  const timeRanges: TimeRange[] = ['1h', '24h', '7d', '30d'];

  const isPaused = !stats.isActive;

  // For paused endpoints, we still want to show the last historical data
  const uptimeColor = isPaused 
    ? 'text-gray-400' // Gray for paused
    : stats.uptime >= 99 ? 'text-green-400' 
      : stats.uptime >= 95 ? 'text-yellow-400' 
        : 'text-red-400';

  const responseColor = isPaused 
    ? 'text-gray-400' // Gray for paused
    : stats.latestStatus === 'success' ? 'text-green-400' 
      : stats.latestStatus === 'failure' ? 'text-red-400' 
        : stats.latestStatus === 'timeout' ? 'text-yellow-400' 
          : 'text-blue-400';

  // For paused endpoints, show the last historical response time
  // For active endpoints, show latest if available, otherwise avg
  const currentResponseTime = stats.latestResponseTime !== undefined 
    ? Math.round(stats.latestResponseTime) 
    : Math.round(stats.avgResponseTime);

  const items = [
    { 
      label: 'Current', 
      sublabel: 'Response', 
      value: currentResponseTime, 
      unit: 'ms', 
      color: responseColor,
      isPaused
    },
    { 
      label: 'Avg Response', 
      sublabel: timeRange, 
      value: Math.round(stats.avgResponseTime), 
      unit: 'ms', 
      color: 'text-blue-400',
      isPaused
    },
    { 
      label: 'Uptime', 
      sublabel: timeRange, 
      value: `${stats.uptime.toFixed(2)}%`, 
      color: uptimeColor,
      isPaused
    },
    {
      label: 'Success', 
      sublabel: 'checks',
      value: stats.successCount,
      color: 'text-green-400',
      isPaused
    },
    { 
      label: 'Failures', 
      sublabel: `${stats.failureCount} checks`, 
      value: stats.failureCount, 
      color: stats.failureCount > 0 ? 'text-red-400' : 'text-gray-500',
      isPaused
    },
    { 
      label: 'Timeouts', 
      sublabel: `${stats.timeoutCount} checks`, 
      value: stats.timeoutCount, 
      color: stats.timeoutCount > 0 ? 'text-yellow-400' : 'text-gray-500',
      isPaused
    },
  ];

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
      {/* Time range selector */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Time Range:</span>
          <div className="flex items-center gap-1">
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
        </div>
        {isPaused && (
          <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/30">
            Historical Data (Last check: {currentResponseTime}ms)
          </span>
        )}
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
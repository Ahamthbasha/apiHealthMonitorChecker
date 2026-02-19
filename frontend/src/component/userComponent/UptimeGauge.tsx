// src/component/userComponent/UptimeGauge.tsx
import React from 'react';

interface UptimeGaugeProps {
  uptime: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const UptimeGauge: React.FC<UptimeGaugeProps> = ({ 
  uptime, 
  size = 'md',
  showLabel = true 
}) => {
  const getColor = (value: number) => {
    if (value >= 99.9) return 'text-green-600';
    if (value >= 99) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Removed unused getBgColor function

  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl'
  };

  // Calculate dimensions based on size
  const dimensions = {
    sm: { strokeWidth: 8, radius: 28 },
    md: { strokeWidth: 10, radius: 42 },
    lg: { strokeWidth: 12, radius: 56 }
  };

  const { strokeWidth, radius } = dimensions[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (uptime / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`${sizeClasses[size]} transform -rotate-90`}>
        {/* Background circle */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
        {/* Progress circle */}
        <circle
          className={getColor(uptime)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50%"
          cy="50%"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={`font-bold ${getColor(uptime)}`}>
            {uptime.toFixed(2)}%
          </span>
          <span className="text-xs text-gray-500">uptime</span>
        </div>
      )}
    </div>
  );
};

export default UptimeGauge;
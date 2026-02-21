import React, { useMemo } from 'react';
import type { ResponseTimeChartProps } from './interface/IResponseTimeChart';

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ data, height = 200, isPaused = false }) => {
  const chartData = useMemo(() => {
    return data || [];
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-800/30 rounded-lg border border-gray-700/30"
        style={{ height }}
      >
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  const maxVal = Math.max(...chartData.map((d) => d.responseTime), 1);
  const minVal = Math.min(...chartData.map((d) => d.responseTime), 0);
  const range = maxVal - minVal || 1;
  
  const svgWidth = 800;
  const svgHeight = height;
  const padX = 60;
  const padY = 20;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  const points = chartData.map((d, i) => ({
    x: padX + (i / (chartData.length - 1 || 1)) * chartW,
    y: padY + chartH - ((d.responseTime - minVal) / range) * chartH,
    data: d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const yLabels = [0, 25, 50, 75, 100].map((percent) => ({
    value: Math.round(minVal + (range * percent) / 100),
    y: padY + chartH - (percent / 100) * chartH,
  }));

  const getOptimalLabelCount = () => {
    const dataLength = chartData.length;
    if (dataLength <= 10) return dataLength;
    if (dataLength <= 20) return 6;
    if (dataLength <= 50) return 5;
    return 4;
  };

  const optimalLabelCount = getOptimalLabelCount();
  
  const getXLabelIndices = () => {
    if (chartData.length <= optimalLabelCount) {
      return chartData.map((_, i) => i);
    }
    
    const indices = [];
    const step = (chartData.length - 1) / (optimalLabelCount - 1);
    
    for (let i = 0; i < optimalLabelCount; i++) {
      const index = Math.round(i * step);
      indices.push(Math.min(index, chartData.length - 1));
    }
    
    return indices;
  };

  const xLabelIndices = getXLabelIndices();
  
  const xLabels = xLabelIndices.map((index) => {
    const item = chartData[index];
    const x = padX + (index / (chartData.length - 1 || 1)) * chartW;
    const timeLabel = item.formattedTime || new Date(item.checkedAt).toLocaleTimeString();
    const simplifiedTime = timeLabel.replace(/:(\d{2}) /, ' ');
    
    return {
      x,
      label: simplifiedTime,
      fullDate: item.formattedDateTime || new Date(item.checkedAt).toLocaleString(),
    };
  });

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700/30 p-2">
      {/* Paused indicator */}
      {isPaused && (
        <div className="absolute top-2 right-2 z-10 bg-amber-400/10 text-amber-400 text-xs px-2 py-1 rounded border border-amber-400/30">
          Historical Data
        </div>
      )}
      
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPaused ? "#6B7280" : "#22c55e"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPaused ? "#6B7280" : "#22c55e"} stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines and Y-axis labels */}
        {yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padX}
              y1={label.y}
              x2={svgWidth - padX}
              y2={label.y}
              stroke="#374151"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />
            <text 
              x={padX - 8} 
              y={label.y + 4} 
              textAnchor="end" 
              fontSize="10" 
              fill="#9CA3AF"
              className="text-[8px] sm:text-[10px]"
            >
              {label.value}ms
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={isPaused ? "#6B7280" : "#22c55e"}
          strokeWidth="2"
          filter="url(#glow)"
        />

        {/* Data points */}
        {points.map((p, i) => 
          p.data.status !== 'success' ? (
            <circle 
              key={i} 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill={p.data.status === 'timeout' ? '#EAB308' : '#EF4444'} 
              stroke="#1F2937"
              strokeWidth="1"
              className="cursor-pointer"
            >
              <title>{`${p.data.status} - ${p.data.responseTime}ms at ${p.data.formattedDateTime || p.data.checkedAt}${isPaused ? ' (Historical)' : ''}`}</title>
            </circle>
          ) : null
        )}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <g key={i}>
            <line
              x1={l.x}
              y1={padY}
              x2={l.x}
              y2={svgHeight - padY}
              stroke="#374151"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.3"
            />
            <text 
              x={l.x} 
              y={svgHeight - 8} 
              textAnchor="middle" 
              fontSize="9" 
              fill="#9CA3AF"
              className="text-[7px] sm:text-[9px]"
              transform={`rotate(0, ${l.x}, ${svgHeight - 8})`}
            >
              <tspan className="hidden sm:inline">{l.label}</tspan>
              <tspan className="sm:hidden">{l.label.replace(/[AP]M$/, '')}</tspan>
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text 
          x={svgWidth / 2} 
          y={svgHeight - 2} 
          textAnchor="middle" 
          fontSize="10" 
          fill="#6B7280"
          className="text-[8px] sm:text-[10px]"
        >
          <tspan className="hidden sm:inline">Time (Oldest → Newest)</tspan>
          <tspan className="sm:hidden">Time →</tspan>
        </text>
        <text 
          x={15} 
          y={svgHeight / 2} 
          textAnchor="middle" 
          fontSize="10" 
          fill="#6B7280"
          transform={`rotate(-90, 15, ${svgHeight / 2})`}
          className="text-[8px] sm:text-[10px]"
        >
          ms
        </text>
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Success</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span>Timeout</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>Failure</span>
        </div>
        {isPaused && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span>Historical</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseTimeChart;
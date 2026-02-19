import React, { useMemo } from 'react';
import { type HealthCheckDTO, type TimeRange } from '../../../types/dashboard';

interface ResponseTimeChartProps {
  data: HealthCheckDTO[];
  timeRange?: TimeRange;
  height?: number;
}

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ data, height = 200 }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sorted = [...data].sort(
      (a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime()
    );
    return sorted.slice(-60);
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
  const svgWidth = 800;
  const svgHeight = height;
  const padX = 50;
  const padY = 20;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  const points = chartData.map((d, i) => ({
    x: padX + (i / (chartData.length - 1 || 1)) * chartW,
    y: padY + chartH - (d.responseTime / maxVal) * chartH,
    data: d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  const yLabels = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map((v) => ({
    value: Math.round(v),
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const xLabels = [0, Math.floor(chartData.length / 2), chartData.length - 1]
    .filter((i) => chartData[i])
    .map((i) => ({
      x: padX + (i / (chartData.length - 1 || 1)) * chartW,
      label: formatTime(chartData[i].checkedAt),
    }));

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700/30 p-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

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
            <text x={padX - 6} y={label.y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
              {label.value}ms
            </text>
          </g>
        ))}

        <path d={areaD} fill="url(#chartGradient)" />

        <path
          d={pathD}
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          filter="url(#glow)"
        />

        {points.map((p, i) =>
          p.data.status !== 'success' ? (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ef4444" />
          ) : null
        )}

        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={svgHeight - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Fallback: parse "DD/MM/YYYY, HH:MM:SS am/pm"
    // day/month/year are not needed — only the time portion is used
    const [, timePart] = dateStr.split(', ');
    const [time, meridian] = timePart.split(' ');
    const [h, m] = time.split(':').map(Number);
    let hours = h;
    if (meridian === 'pm' && hours !== 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export default ResponseTimeChart;
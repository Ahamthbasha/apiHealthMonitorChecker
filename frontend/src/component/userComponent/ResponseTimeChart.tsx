// src/component/userComponent/ResponseTimeChart.tsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import type { ChartOptions, TooltipItem } from 'chart.js';
import { type HealthCheck } from '../../types/interface/healthCheckInterface';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface ResponseTimeChartProps {
  data: HealthCheck[];
  timeRange: '1h' | '24h' | '7d' | '30d';
  height?: number;
}

// Define proper type for chart context
interface DatasetContext {
  dataIndex: number;
  dataset?: any;
}

const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ 
  data, 
  timeRange,
  height = 300 
}) => {
  const chartData = {
    datasets: [
      {
        label: 'Response Time (ms)',
        data: data.map(check => ({
          x: new Date(check.checkedAt),
          y: check.responseTime
        })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: (context: DatasetContext) => {
          const check = data[context.dataIndex];
          if (!check) return 'rgb(59, 130, 246)';
          return check.status === 'success' 
            ? 'rgb(34, 197, 94)' 
            : check.status === 'timeout' 
            ? 'rgb(249, 115, 22)' 
            : 'rgb(239, 68, 68)';
        },
        tension: 0.1,
        fill: true
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const check = data[context.dataIndex];
            if (!check) return `Response: ${context.parsed.y}ms`;
            return [
              `Response: ${context.parsed.y}ms`,
              `Status: ${check.status}`,
              check.statusCode ? `HTTP: ${check.statusCode}` : '',
              check.errorMessage ? `Error: ${check.errorMessage}` : ''
            ].filter(Boolean);
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '1h' ? 'minute' : 
                timeRange === '24h' ? 'hour' : 'day',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No data available for this time period</p>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ResponseTimeChart;
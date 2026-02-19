// src/component/userComponent/HealthStatusBadge.tsx
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface HealthStatusBadgeProps {
  status: 'up' | 'down' | 'degraded' | 'pending';
  size?: 'sm' | 'md';
}

const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    up: {
      icon: CheckCircle,
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      label: 'Operational'
    },
    degraded: {
      icon: AlertTriangle,
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      label: 'Degraded'
    },
    down: {
      icon: XCircle,
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      label: 'Down'
    },
    pending: {
      icon: Clock,
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      label: 'Pending'
    }
  };

  const { icon: Icon, bg, text, border, label } = config[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center ${bg} ${text} ${border} border rounded-full ${sizeClasses}`}>
      <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
      {label}
    </span>
  );
};

export default HealthStatusBadge;
// src/components/StatusBadge.tsx
import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  isActive: boolean;
  status?: 'up' | 'down' | 'degraded' | 'pending';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive, status = 'up' }) => {
  if (!isActive) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  }

  const statusConfig = {
    up: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: CheckCircle,
      label: 'Operational',
    },
    down: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: XCircle,
      label: 'Down',
    },
    degraded: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: Clock,
      label: 'Degraded',
    },
    pending: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: Clock,
      label: 'Pending',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <config.icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
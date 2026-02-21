
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import {type ToastItem } from '../../../types/healthCheck';
import type { ToastProps } from './interface/IToast';

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    success: {
      icon: <CheckCircle className="w-4 h-4" />,
      cls: 'border-green-500/30 bg-gray-900 text-green-400',
      bar: 'bg-green-500',
    },
    error: {
      icon: <XCircle className="w-4 h-4" />,
      cls: 'border-red-500/30 bg-gray-900 text-red-400',
      bar: 'bg-red-500',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4" />,
      cls: 'border-yellow-500/30 bg-gray-900 text-yellow-400',
      bar: 'bg-yellow-500',
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      cls: 'border-blue-500/30 bg-gray-900 text-blue-400',
      bar: 'bg-blue-500',
    },
  }[type];

  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl overflow-hidden ${config.cls} animate-in slide-in-from-right-4`}
      style={{ minWidth: '280px', maxWidth: '380px' }}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${config.bar} animate-shrink`}
        style={{ animationDuration: '5s', animationTimingFunction: 'linear' }}
      />
      {config.icon}
      <p className="text-sm font-medium text-gray-200 flex-1">{message}</p>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id} className="pointer-events-auto">
        <Toast {...t} onClose={() => onRemove(t.id)} />
      </div>
    ))}
  </div>
);

export default Toast;
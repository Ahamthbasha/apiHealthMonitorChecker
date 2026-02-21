import React, { useState } from 'react';
import { Play, Pause, Edit, Trash2, ExternalLink, Wifi, WifiOff, MoreVertical, History, Loader2 } from 'lucide-react'; 
import { type EndpointStatus } from '../../../types/healthCheck';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom'; 
import type { EndpointHeaderProps } from './interface/IEndpointHeader';

function parseCheckedAt(dateStr: string | undefined): Date {
  if (!dateStr) return new Date(0);
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    const [datePart, timePart] = dateStr.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [time, meridian] = timePart.split(' ');
    const [h, m, s] = time.split(':').map(Number);
    let hours = h;
    if (meridian === 'pm' && hours !== 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, m, s);
  } catch {
    return new Date(0);
  }
}

const StatusPill: React.FC<{ status: EndpointStatus['status']; isActive?: boolean }> = ({ status, isActive }) => {
  if (!isActive) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold shadow-lg bg-gray-500 text-white shadow-gray-500/30">
        Inactive
      </span>
    );
  }

  const config = {
    up: { label: 'Up', cls: 'bg-green-500 text-white shadow-green-500/30' },
    down: { label: 'Down', cls: 'bg-red-500 text-white shadow-red-500/30' },
    degraded: { label: 'Degraded', cls: 'bg-yellow-500 text-black shadow-yellow-500/30' },
    inactive: { label: 'Inactive', cls: 'bg-gray-500 text-white shadow-gray-500/30' },
  }[status];
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${config.cls}`}>
      {config.label}
    </span>
  );
};

const EndpointHeader: React.FC<EndpointHeaderProps> = ({
  endpoint, 
  isConnected, 
  onManualCheck, 
  onToggle, 
  onEdit, 
  onDelete,
  isToggling = false,
  isChecking = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditHovered, setIsEditHovered] = useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const navigate = useNavigate();
  
  const lastChecked = parseCheckedAt(endpoint.lastChecked);
  const timeAgo = lastChecked.getTime() > 0 ? formatDistanceToNow(lastChecked, { addSuffix: true }) : 'Never';

  const handleViewHistory = () => {
    navigate(`/endpoints/${endpoint.endpointId}/history`);
  };

  const handleToggleClick = async () => {
    await onToggle();
  };

  const handleManualCheckClick = async () => {
    await onManualCheck();
  };

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate max-w-[160px] sm:max-w-none">
              {endpoint.name}
            </h1>
            <StatusPill status={endpoint.status} isActive={endpoint.isActive} />
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
              isConnected ? 'text-green-400 border-green-500/30 bg-green-500/5' : 'text-gray-500 border-gray-600 bg-gray-800'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            {!endpoint.isActive && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Paused</span>
            )}
          </div>

          {/* URL + meta */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-400">
            <a
              href={endpoint.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors"
            >
              <span className="truncate max-w-[180px] sm:max-w-xs">{endpoint.url}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-gray-400">Checked {timeAgo}</span>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <span className="font-mono hidden sm:inline">{endpoint.lastResponseTime}ms</span>
          </div>
          {/* Mobile-only secondary meta */}
          <div className="flex items-center gap-2 mt-1 sm:hidden text-xs text-gray-500">
            <span>{timeAgo}</span>
            <span className="text-gray-700">•</span>
            <span className="font-mono">{endpoint.lastResponseTime}ms</span>
          </div>
        </div>

        {/* Right: desktop full buttons */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {/* View History button */}
          <button
            onClick={handleViewHistory}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-sm rounded-lg transition-all hover:scale-105 active:scale-95"
            title="View Full History"
          >
            <History className="w-4 h-4" /> History
          </button>
          
          {/* Toggle/Pause button with loading state */}
          <button 
            onClick={handleToggleClick} 
            disabled={isToggling}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
              endpoint.isActive 
                ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 hover:scale-105 active:scale-95' 
                : 'bg-green-600 hover:bg-green-500 text-white font-semibold shadow-lg shadow-green-900/30 hover:scale-105 active:scale-95'
            } ${isToggling ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : endpoint.isActive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isToggling ? 'Processing...' : (endpoint.isActive ? 'Pause' : 'Resume')}
          </button>
          
          {/* Edit button with hover effect */}
          <button 
            onClick={onEdit} 
            onMouseEnter={() => setIsEditHovered(true)}
            onMouseLeave={() => setIsEditHovered(false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 text-sm rounded-lg transition-all hover:scale-105 active:scale-95 relative overflow-hidden"
          >
            <Edit className="w-4 h-4" />
            <span className="relative z-10">Edit</span>
            {isEditHovered && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            )}
          </button>
          
          {/* Delete button with hover effect */}
          <button 
            onClick={() => onDelete()}  
            onMouseEnter={() => setIsDeleteHovered(true)}
            onMouseLeave={() => setIsDeleteHovered(false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-red-400 text-sm rounded-lg transition-all hover:scale-105 active:scale-95 relative overflow-hidden"
          >
            <Trash2 className="w-4 h-4" />
            <span className="relative z-10">Delete</span>
            {isDeleteHovered && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-shimmer" />
            )}
          </button>
          
          {/* Manual Check button with loading state */}
          <button 
            onClick={handleManualCheckClick} 
            disabled={!endpoint.isActive || isChecking}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-lg ${
              endpoint.isActive 
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/30 hover:scale-105 active:scale-95' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            } ${isChecking ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isChecking ? 'Checking...' : 'Check Now'}
          </button>
        </div>

        {/* Right: mobile — Check Now + kebab */}
        <div className="flex md:hidden items-center gap-2 flex-shrink-0">
          {/* Mobile Manual Check button with loading state */}
          <button 
            onClick={handleManualCheckClick} 
            disabled={!endpoint.isActive || isChecking}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
              endpoint.isActive 
                ? 'bg-green-600 hover:bg-green-500 text-white active:scale-95' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            } ${isChecking ? 'opacity-70 cursor-wait' : ''}`}
          >
            {isChecking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isChecking ? 'Checking...' : 'Check Now'}</span>
          </button>
          
          {/* Mobile menu with loading states */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              disabled={isToggling || isChecking}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[180px] overflow-hidden">
                  <button 
                    onClick={() => { handleViewHistory(); setMenuOpen(false); }} 
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-blue-400 hover:bg-blue-900/30 transition-all active:bg-blue-900/50"
                  >
                    <History className="w-4 h-4" /> View History
                  </button>
                  
                  {/* Mobile Toggle with loading */}
                  <button 
                    onClick={async () => { 
                      await handleToggleClick(); 
                      setMenuOpen(false); 
                    }} 
                    disabled={isToggling}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-all ${
                      endpoint.isActive 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-green-400 hover:bg-green-900/30'
                    } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : endpoint.isActive ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isToggling ? 'Processing...' : (endpoint.isActive ? 'Pause Monitor' : 'Resume Monitor')}
                  </button>
                  
                  {/* Mobile Edit */}
                  <button 
                    onClick={() => { onEdit(); setMenuOpen(false); }} 
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-all active:bg-gray-600"
                  >
                    <Edit className="w-4 h-4" /> Edit Monitor
                  </button>
                  
                  {/* Mobile Delete */}
                  <button 
                    onClick={() => {onDelete(); setMenuOpen(false); }} 
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-900/30 transition-all active:bg-red-900/50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Monitor
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

     
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default EndpointHeader;
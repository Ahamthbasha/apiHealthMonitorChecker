// components/dashboard/EndpointHeader.tsx
import React, { useState } from 'react';
import { Play, Pause, Edit, Trash2, ExternalLink, Wifi, WifiOff, MoreVertical } from 'lucide-react';
import { type EndpointStatus } from '../../../types/dashboard';
import { formatDistanceToNow } from 'date-fns';

interface EndpointHeaderProps {
  endpoint: EndpointStatus;
  isConnected: boolean;
  onManualCheck: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

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

const StatusPill: React.FC<{ status: EndpointStatus['status'] }> = ({ status }) => {
  const config = {
    up: { label: 'Up', cls: 'bg-green-500 text-white shadow-green-500/30' },
    down: { label: 'Down', cls: 'bg-red-500 text-white shadow-red-500/30' },
    degraded: { label: 'Degraded', cls: 'bg-yellow-500 text-black shadow-yellow-500/30' },
  }[status];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${config.cls}`}>
      {config.label}
    </span>
  );
};

const EndpointHeader: React.FC<EndpointHeaderProps> = ({
  endpoint, isConnected, onManualCheck, onToggle, onEdit, onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const lastChecked = parseCheckedAt(endpoint.lastChecked);
  const timeAgo = lastChecked.getTime() > 0 ? formatDistanceToNow(lastChecked, { addSuffix: true }) : 'Never';

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate max-w-[160px] sm:max-w-none">
              {endpoint.name}
            </h1>
            <StatusPill status={endpoint.status} />
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
              isConnected ? 'text-green-400 border-green-500/30 bg-green-500/5' : 'text-gray-500 border-gray-600 bg-gray-800'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
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
          <button onClick={onToggle} className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 text-sm rounded-lg transition-colors">
            <Pause className="w-4 h-4" /> Pause
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 text-sm rounded-lg transition-colors">
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-red-400 text-sm rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button onClick={onManualCheck} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-green-900/30">
            <Play className="w-4 h-4" /> Check Now
          </button>
        </div>

        {/* Right: mobile — Check Now + kebab */}
        <div className="flex md:hidden items-center gap-2 flex-shrink-0">
          <button onClick={onManualCheck} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Check Now</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[130px] overflow-hidden">
                  <button onClick={() => { onToggle(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                  <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndpointHeader;
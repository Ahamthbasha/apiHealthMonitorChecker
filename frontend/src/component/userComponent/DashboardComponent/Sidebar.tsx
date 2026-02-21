
import React, { useState } from 'react';
import { Plus, Search, User, LogOut, Menu, X } from 'lucide-react';
import { type EndpointStatus } from '../../../types/healthCheck';

const generateBarsFromHistory = (
  _status: EndpointStatus['status'], 
  isActive: boolean,
  uptime: number,
  count: number = 40
): boolean[] => {
  const bars: boolean[] = [];
  
  if (!isActive) {
    for (let i = 0; i < count; i++) {
      bars.push(Math.random() > 0.5);
    }
    return bars;
  }

  const successRate = uptime / 100;
  
  for (let i = 0; i < count; i++) {
    const isFailure = i > count - Math.floor((1 - successRate) * count) && Math.random() > 0.7;
    bars.push(isFailure);
  }
  
  return bars;
};

interface UptimeBarsProps {
  status: EndpointStatus['status'];
  isActive: boolean;
  uptime: number;
  count?: number;
}

const UptimeBars: React.FC<UptimeBarsProps> = ({ status, isActive, uptime, count = 40 }) => {
  const [bars] = useState<boolean[]>(() => 
    generateBarsFromHistory(status, isActive, uptime, count)
  );
  
  // Different colors for inactive state
  const getBarColor = (isDown: boolean) => {
    if (!isActive) {
      return isDown ? 'bg-gray-600' : 'bg-gray-500';
    }
    return isDown ? 'bg-red-500' : 'bg-green-500';
  };
  
  return (
    <div className="flex items-center gap-px">
      {bars.map((isDown, i) => (
        <div 
          key={i} 
          className={`w-[3px] h-4 rounded-sm transition-colors ${getBarColor(isDown)}`}
          title={!isActive ? 'Paused' : (isDown ? 'Failure' : 'Success')}
        />
      ))}
    </div>
  );
};

interface MonitorRowProps {
  endpoint: EndpointStatus;
  isSelected: boolean;
  onSelect: () => void;
}

const MonitorRow: React.FC<MonitorRowProps> = ({ endpoint, isSelected, onSelect }) => {
  // Status colors including inactive
  const statusColor = { 
    up: 'bg-green-500', 
    down: 'bg-red-500', 
    degraded: 'bg-yellow-500',
    inactive: 'bg-gray-500'
  }[endpoint.status];
  
  const uptimeColor = { 
    up: 'text-green-400', 
    down: 'text-red-400', 
    degraded: 'text-yellow-400',
    inactive: 'text-gray-400'
  }[endpoint.status];
  
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-2 ${
        isSelected ? 'bg-gray-800 border-green-500' : 'border-transparent hover:bg-gray-800/50 hover:border-gray-600'
      } ${!endpoint.isActive ? 'opacity-60' : ''}`}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${uptimeColor} bg-gray-900 font-mono`}>
            {endpoint.uptime.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-200 truncate font-medium">{endpoint.name}</span>
          {!endpoint.isActive && (
            <span className="text-xs text-gray-500 ml-1">(Paused)</span>
          )}
        </div>
        <div className="mt-1.5">
          <UptimeBars 
            status={endpoint.status} 
            isActive={endpoint.isActive}
            uptime={endpoint.uptime}
            count={30} 
          />
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  statuses: EndpointStatus[];
  selectedEndpoint: EndpointStatus | null;
  searchTerm: string;
  isConnected: boolean;
  collapsed: boolean;
  userName: string;
  onSelectEndpoint: (ep: EndpointStatus) => void;
  onAddNew: () => void;
  onLogout: () => void;
  onSearchChange: (term: string) => void;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  statuses,
  selectedEndpoint,
  searchTerm,
  isConnected,
  collapsed,
  userName,
  onSelectEndpoint,
  onAddNew,
  onLogout,
  onSearchChange,
  onToggleCollapse,
  isMobile = false,
  onMobileClose,
}) => {
  const filtered = statuses.filter(
    (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (ep: EndpointStatus) => {
    onSelectEndpoint(ep);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const handleAddNew = () => {
    onAddNew();
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <div className={`flex flex-col h-full ${isMobile ? 'w-72' : collapsed ? 'w-14' : 'w-72'} bg-gray-900 border-r border-gray-700/50 transition-all duration-300`} style={{ minHeight: isMobile ? 'auto' : '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700/50 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">API Monitor</span>
            <div className={`w-2 h-2 rounded-full ml-1 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        )}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search + Add */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-700/50 space-y-2 flex-shrink-0">
          <button
            onClick={handleAddNew}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Monitor
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
            <input
              type="text" 
              value={searchTerm} 
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {collapsed && !isMobile ? (
          <div className="py-2 space-y-1">
            {filtered.map((s) => (
              <div 
                key={s.endpointId} 
                onClick={() => handleSelect(s)} 
                className="flex justify-center py-2 cursor-pointer hover:bg-gray-800" 
                title={`${s.name} - ${s.uptime.toFixed(0)}% uptime`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${
                  s.status === 'up' ? 'bg-green-500' : 
                  s.status === 'degraded' ? 'bg-yellow-500' : 
                  s.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                }`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((s) => (
              <MonitorRow
                key={s.endpointId} 
                endpoint={s}
                isSelected={selectedEndpoint?.endpointId === s.endpointId}
                onSelect={() => handleSelect(s)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No monitors found</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700/50 flex-shrink-0">
        {collapsed && !isMobile ? (
          <button className="w-full flex justify-center p-2 hover:bg-gray-700 rounded-lg text-gray-400">
            <User className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 font-medium truncate">{userName || 'User'}</p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
            <button 
              onClick={onLogout} 
              className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
import React, { useState } from 'react';
import { Plus, Search, Power, Edit, Trash2, User, LogOut, Menu, X } from 'lucide-react';
import { type EndpointStatus } from '../../../types/dashboard';

function generateBars(status: EndpointStatus['status'], count: number): boolean[] {
  return Array.from({ length: count }, (_, i) => {
    if (status === 'down') return Math.random() > 0.3;
    if (status === 'degraded') return i > count - 8 && Math.random() > 0.5;
    return false;
  });
}

const UptimeBars: React.FC<{ status: EndpointStatus['status']; count?: number }> = ({ status, count = 40 }) => {
  const [bars] = useState<boolean[]>(() => generateBars(status, count));
  return (
    <div className="flex items-center gap-px">
      {bars.map((isDown, i) => (
        <div key={i} className={`w-[3px] h-4 rounded-sm ${isDown ? 'bg-red-500' : 'bg-green-500'}`} />
      ))}
    </div>
  );
};

interface MonitorRowProps {
  endpoint: EndpointStatus;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const MonitorRow: React.FC<MonitorRowProps> = ({ endpoint, isSelected, onSelect, onToggle, onEdit, onDelete }) => {
  const statusColor = { up: 'bg-green-500', down: 'bg-red-500', degraded: 'bg-yellow-500' }[endpoint.status];
  const uptimeColor = { up: 'text-green-400', down: 'text-red-400', degraded: 'text-yellow-400' }[endpoint.status];
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-2 ${
        isSelected ? 'bg-gray-800 border-green-500' : 'border-transparent hover:bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${uptimeColor} bg-gray-900 font-mono`}>
            {endpoint.uptime.toFixed(0)}%
          </span>
          <span className="text-sm text-gray-200 truncate font-medium">{endpoint.name}</span>
        </div>
        <div className="mt-1.5">
          <UptimeBars status={endpoint.status} count={30} />
        </div>
      </div>
      <div className="hidden group-hover:flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-md px-1 py-0.5 shadow-lg border border-gray-700">
        <button onClick={onToggle} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title={endpoint.status === 'down' ? 'Activate' : 'Pause'}>
          <Power className="w-3 h-3" />
        </button>
        <button onClick={onEdit} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="Edit">
          <Edit className="w-3 h-3" />
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-900/50 text-gray-400 hover:text-red-400" title="Delete">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Inner component moved outside of Sidebar
interface InnerSidebarProps {
  isCollapsed: boolean;
  statuses: EndpointStatus[];
  selectedEndpoint: EndpointStatus | null;
  searchTerm: string;
  isConnected: boolean;
  userName: string;
  onSelectEndpoint: (ep: EndpointStatus) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onLogout: () => void;
  onSearchChange: (term: string) => void;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}

const InnerSidebar: React.FC<InnerSidebarProps> = ({
  isCollapsed,
  statuses,
  selectedEndpoint,
  searchTerm,
  isConnected,
  userName,
  onSelectEndpoint,
  onToggle,
  onEdit,
  onDelete,
  onAddNew,
  onLogout,
  onSearchChange,
  onToggleCollapse,
  onMobileClose,
}) => {
  const filtered = statuses.filter(
    (s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (ep: EndpointStatus) => { 
    onSelectEndpoint(ep); 
    if (onMobileClose) onMobileClose(); 
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700/50 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">API Monitor</span>
            <div className={`w-2 h-2 rounded-full ml-1 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Search + Add */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-gray-700/50 space-y-2 flex-shrink-0">
          <button
            onClick={onAddNew}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Monitor
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
            <input
              type="text" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          <div className="py-2 space-y-1">
            {filtered.map((s) => (
              <div key={s.endpointId} onClick={() => handleSelect(s)} className="flex justify-center py-2 cursor-pointer hover:bg-gray-800" title={s.name}>
                <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'up' ? 'bg-green-500' : s.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((s) => (
              <MonitorRow
                key={s.endpointId} endpoint={s}
                isSelected={selectedEndpoint?.endpointId === s.endpointId}
                onSelect={() => handleSelect(s)}
                onToggle={(e) => { e.stopPropagation(); onToggle(s.endpointId); }}
                onEdit={(e) => { e.stopPropagation(); onEdit(s.endpointId); }}
                onDelete={(e) => { e.stopPropagation(); onDelete(s.endpointId); }}
              />
            ))}
            {filtered.length === 0 && <div className="px-4 py-8 text-center text-gray-500 text-sm">No monitors found</div>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700/50 flex-shrink-0">
        {isCollapsed ? (
          <button className="w-full flex justify-center p-2 hover:bg-gray-700 rounded-lg text-gray-400"><User className="w-4 h-4" /></button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 font-medium truncate">{userName || 'User'}</p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
            <button onClick={onLogout} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
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
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onLogout: () => void;
  onSearchChange: (term: string) => void;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  statuses, selectedEndpoint, searchTerm, isConnected, collapsed,
  userName, onSelectEndpoint, onToggle, onEdit, onDelete,
  onAddNew, onLogout, onSearchChange, onToggleCollapse,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-gray-700/50 flex items-center justify-between px-4 h-14 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">API Monitor</span>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        <button onClick={() => setMobileOpen((o) => !o)} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 left-0 bottom-0 w-72 bg-gray-900 border-r border-gray-700/50">
            <InnerSidebar
              isCollapsed={false}
              statuses={statuses}
              selectedEndpoint={selectedEndpoint}
              searchTerm={searchTerm}
              isConnected={isConnected}
              userName={userName}
              onSelectEndpoint={onSelectEndpoint}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddNew={onAddNew}
              onLogout={onLogout}
              onSearchChange={onSearchChange}
              onToggleCollapse={onToggleCollapse}
              onMobileClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex flex-col ${collapsed ? 'w-14' : 'w-72'} bg-gray-900 border-r border-gray-700/50 transition-all duration-300 flex-shrink-0`}
        style={{ minHeight: '100vh' }}
      >
        <InnerSidebar
          isCollapsed={collapsed}
          statuses={statuses}
          selectedEndpoint={selectedEndpoint}
          searchTerm={searchTerm}
          isConnected={isConnected}
          userName={userName}
          onSelectEndpoint={onSelectEndpoint}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddNew={onAddNew}
          onLogout={onLogout}
          onSearchChange={onSearchChange}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    </>
  );
};

export default Sidebar;
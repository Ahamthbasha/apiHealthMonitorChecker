import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { toggleEndpoint, deleteEndpoint, getEndpointStats, getEndpointHistory, triggerManualCheck } from '../../../api/userAction/userAction';
import { wsService } from '../../../services/websocketService';

import type { EndpointStatus, HealthCheckDTO, EndpointStats, ToastItem, TimeRange } from '../../../types/dashboard';

import Sidebar from '../../../component/userComponent/DashboardComponent/Sidebar';
import StatsBar from '../../../component/userComponent/DashboardComponent/Statsbar';
import EndpointHeader from '../../../component/userComponent/DashboardComponent/EndpointHeader';
import ResponseTimeChart from '../../../component/userComponent/DashboardComponent/ResponseTimeChart';
import RecentChecksTable from '../../../component/userComponent/DashboardComponent/RecentChecksTable';
import EmptyState from '../../../component/userComponent/DashboardComponent/EmptyState';
import { ToastContainer } from '../../../component/userComponent/DashboardComponent/Toast';
import ConfirmationModal from '../../../component/common/ConfirmationModal';

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-green-500 animate-spin" />
      <p className="text-gray-500 text-sm">Loading monitors...</p>
    </div>
  </div>
);

const UptimeKumaDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [statuses, setStatuses] = useState<EndpointStatus[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointStatus | null>(null);
  const [stats, setStats] = useState<EndpointStats | null>(null);
  const [history, setHistory] = useState<HealthCheckDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; endpointId: string | null }>({ isOpen: false, endpointId: null });
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const selectedEndpointRef = useRef(selectedEndpoint);
  const statusesRef = useRef(statuses);

  useEffect(() => { selectedEndpointRef.current = selectedEndpoint; }, [selectedEndpoint]);
  useEffect(() => { statusesRef.current = statuses; }, [statuses]);

  const addToast = useCallback((message: string, type: ToastItem['type']) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      wsService.connect().then(() => { wsService.requestInitialData(); }).catch(() => { addToast('Failed to connect to real-time updates', 'error'); });
    }

    wsService.on('connection-status', ({ connected }) => {
      setIsConnected(connected);
      if (connected) addToast('Connected to real-time updates', 'success');
      else addToast('Disconnected from real-time updates', 'warning');
    });

    wsService.on('initial-data', (data) => {
      setStatuses(data.statuses);
      if (data.statuses.length > 0 && !selectedEndpointRef.current) {
        setSelectedEndpoint(data.statuses[0]);
        wsService.subscribeToEndpoint(data.statuses[0].endpointId);
      }
      setLoading(false);
      setInitialDataLoaded(true);
    });

    wsService.on('endpoint-updated', ({ endpointId, check }) => {
      setStatuses((prev) => prev.map((s) => s.endpointId === endpointId ? {
        ...s,
        lastResponseTime: check.responseTime,
        lastChecked: check.checkedAt,
        status: check.status === 'success' ? 'up' : check.status === 'timeout' ? 'degraded' : 'down',
      } : s));
      if (selectedEndpointRef.current?.endpointId === endpointId) {
        setHistory((prev) => [check, ...prev.slice(0, 99)]);
      }
      const endpoint = statusesRef.current.find((s) => s.endpointId === endpointId);
      if (endpoint) {
        const newStatus = check.status === 'success' ? 'up' : check.status === 'timeout' ? 'degraded' : 'down';
        if (endpoint.status !== newStatus) addToast(`${endpoint.name} is now ${newStatus.toUpperCase()}`, newStatus === 'up' ? 'success' : 'warning');
      }
    });

    wsService.on('live-stats', ({ statuses: newStatuses }) => {
      setStatuses(newStatuses);
      if (selectedEndpointRef.current) {
        const updated = newStatuses.find((s) => s.endpointId === selectedEndpointRef.current?.endpointId);
        if (updated) setSelectedEndpoint(updated);
      }
    });

    wsService.on('threshold-alert', (alert) => { addToast(alert.message, 'warning'); });
    wsService.on('error', (error) => { addToast(error.message || 'WebSocket error occurred', 'error'); });

    return () => { wsService.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedEndpoint && initialDataLoaded) wsService.subscribeToEndpoint(selectedEndpoint.endpointId);
  }, [selectedEndpoint, initialDataLoaded]);

  useEffect(() => {
    if (selectedEndpoint && initialDataLoaded) {
      const hoursMap: Record<TimeRange, number> = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
      const fetchDetails = async () => {
        try {
          const [statsData, historyData] = await Promise.all([
            getEndpointStats(selectedEndpoint.endpointId, hoursMap[timeRange]),
            getEndpointHistory(selectedEndpoint.endpointId, 100),
          ]);
          setStats(statsData);
          setHistory(historyData);
        } catch { addToast('Failed to load endpoint details', 'error'); }
      };
      fetchDetails();
    }
  }, [selectedEndpoint, timeRange, initialDataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectEndpoint = (status: EndpointStatus) => { setSelectedEndpoint(status); wsService.subscribeToEndpoint(status.endpointId); };
  const handleManualCheck = async () => { if (!selectedEndpoint) return; try { await triggerManualCheck(selectedEndpoint.endpointId); addToast('Manual check triggered', 'success'); } catch { addToast('Failed to trigger manual check', 'error'); } };
  const handleToggle = async (endpointId: string) => { try { await toggleEndpoint(endpointId); addToast('Endpoint status toggled', 'success'); } catch { addToast('Failed to toggle endpoint', 'error'); } };
  const handleDelete = async () => {
    if (!deleteModal.endpointId) return;
    try {
      await deleteEndpoint(deleteModal.endpointId);
      setDeleteModal({ isOpen: false, endpointId: null });
      addToast('Endpoint deleted successfully', 'success');
      if (selectedEndpoint?.endpointId === deleteModal.endpointId) setSelectedEndpoint(null);
    } catch { addToast('Failed to delete endpoint', 'error'); }
  };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('userName'); wsService.disconnect(); navigate('/login'); };

  if (loading) return <LoadingSpinner />;

  return (
    // pt-14 on mobile accounts for the fixed top bar injected by Sidebar
    <div className="min-h-screen bg-gray-950 flex font-sans pt-14 md:pt-0">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Sidebar
        statuses={statuses}
        selectedEndpoint={selectedEndpoint}
        searchTerm={searchTerm}
        isConnected={isConnected}
        collapsed={sidebarCollapsed}
        userName={localStorage.getItem('userName') || 'User'}
        onSelectEndpoint={handleSelectEndpoint}
        onToggle={handleToggle}
        onEdit={(id) => navigate(`/endpoints/${id}/edit`)}
        onDelete={(id) => setDeleteModal({ isOpen: true, endpointId: id })}
        onAddNew={() => navigate('/endpoints/create')}
        onLogout={handleLogout}
        onSearchChange={setSearchTerm}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {selectedEndpoint && stats ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <EndpointHeader
              endpoint={selectedEndpoint}
              isConnected={isConnected}
              onManualCheck={handleManualCheck}
              onToggle={() => handleToggle(selectedEndpoint.endpointId)}
              onEdit={() => navigate(`/endpoints/${selectedEndpoint.endpointId}/edit`)}
              onDelete={() => setDeleteModal({ isOpen: true, endpointId: selectedEndpoint.endpointId })}
            />

            {/* Uptime bars */}
            <div className="mb-4 sm:mb-6 bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Uptime History</p>
                <p className="text-xs text-gray-400">Check interval: 5 min</p>
              </div>
              <div className="flex items-end gap-px w-full overflow-hidden">
                {history.slice(-90).map((check, i) => (
                  <div
                    key={check.id || i}
                    className={`flex-1 rounded-sm transition-all min-w-[3px] h-8 ${
                      check.status === 'success' ? 'bg-green-500 hover:bg-green-400' :
                      check.status === 'timeout' ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-red-500 hover:bg-red-400'
                    }`}
                    title={`${check.status} — ${check.responseTime}ms`}
                  />
                ))}
                {history.length === 0 && Array.from({ length: 90 }).map((_, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gray-700 h-8 min-w-[3px]" />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>{history.length > 0 ? '90 checks ago' : 'No data'}</span>
                <span className={`font-semibold ${stats.uptime >= 99 ? 'text-green-400' : stats.uptime >= 95 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {stats.uptime.toFixed(2)}% uptime
                </span>
                <span>Now</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-4 sm:mb-6">
              <StatsBar stats={stats} timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </div>

            {/* Chart */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Response Time
              </h2>
              <ResponseTimeChart data={history} timeRange={timeRange} height={200} />
            </div>

            {/* Recent Checks */}
            <RecentChecksTable
              history={history}
              onViewAll={() => navigate(`/endpoints/${selectedEndpoint.endpointId}`)}
            />
          </div>
        ) : (
          <EmptyState onAddNew={() => navigate('/endpoints/create')} />
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, endpointId: null })}
        onConfirm={handleDelete}
        title="Delete Monitor"
        message="Are you sure you want to delete this monitor? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default UptimeKumaDashboard;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import {
  getAllHealthChecks,
  getEndpointById,
  toggleEndpoint,
  deleteEndpoint,
  triggerManualCheck,
} from '../../../api/userAction/userAction';
import EndpointDetailsCard from '../../../component/userComponent/healthCheckData/EndpointDetailsCard';
import HealthChecksTable from '../../../component/userComponent/healthCheckData/HealthChecksTable';
import ConfirmationModal from '../../../component/common/ConfirmationModal';
import { ToastContainer } from '../../../component/userComponent/DashboardComponent/Toast';
import { wsService } from '../../../services/websocketService';
import type { ApiEndpoint } from '../../../types/interface/apiInterface';
import type { HealthCheckDTO } from '../../../types/interface/healthCheckInterface';
import type { ToastItem } from '../../../types/healthCheck';
import type { EndpointUpdatedData } from '../../../services/websocketService';

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-green-500 animate-spin" />
      <p className="text-gray-500 text-sm">Loading endpoint details...</p>
    </div>
  </div>
);

const EndpointHistoryPage: React.FC = () => {
  const { endpointId } = useParams<{ endpointId: string }>();
  const navigate = useNavigate();

  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null);
  const [checks, setChecks] = useState<HealthCheckDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Toast state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    endpointId: string | null;
  }>({
    isOpen: false,
    endpointId: null,
  });

  // Refs for preventing stale state and duplicate calls
  const endpointRef = useRef(endpoint);
  const isMountedRef = useRef(true);
  const fetchingPageRef = useRef(false);
  const prevPageRef = useRef(page);
  const prevLimitRef = useRef(limit);
  const prevStatusFilterRef = useRef(statusFilter);

  useEffect(() => {
    endpointRef.current = endpoint;
  }, [endpoint]);

  const addToast = useCallback((message: string, type: ToastItem['type']) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle real-time updates from WebSocket - ONLY use endpoint-updated
  const handleEndpointUpdate = useCallback((data: EndpointUpdatedData) => {
    if (data.endpointId === endpointId && isMountedRef.current) {
      console.log('📡 Real-time update received for this endpoint:', data);
      
      // Update checks list with the new check
      setChecks(prevChecks => {
        // Check if this check already exists (prevent duplicates)
        const exists = prevChecks.some(check => check.id === data.check.id);
        if (exists) return prevChecks;
        
        // Add new check at the beginning (newest first)
        const newChecks = [data.check, ...prevChecks];
        
        // If we're on page 1, maintain the limit
        if (page === 1) {
          return newChecks.slice(0, limit);
        }
        return newChecks;
      });
      
      // Update total count
      setTotal(prev => prev + 1);
      setTotalPages(prev => Math.ceil((prev * limit + 1) / limit));
      
      setLastUpdate(new Date());
      
      // Show toast for important status changes
      if (data.check.status !== 'success') {
        addToast(`Endpoint ${data.check.status}: ${data.check.errorMessage || 'Check failed'}`, 'error');
      }
    }
  }, [endpointId, page, limit, addToast]);

  const handleConnectionStatus = useCallback((status: { connected: boolean; reason?: string }) => {
    if (isMountedRef.current) {
      setWsConnected(status.connected);
      if (status.connected) {
        addToast('Real-time updates connected', 'success');
      } else {
        addToast(`Real-time updates disconnected: ${status.reason || 'unknown reason'}`, 'warning');
      }
    }
  }, [addToast]);

  const handleEndpointDeleted = useCallback((data: { endpointId: string; timestamp: string }) => {
    if (data.endpointId === endpointId && isMountedRef.current) {
      addToast('This endpoint has been deleted', 'error');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, [endpointId, navigate, addToast]);

  // Setup WebSocket connection - NO initial-data listener
  useEffect(() => {
    isMountedRef.current = true;

    const setupWebSocket = async () => {
      try {
        if (!wsService.isConnected()) {
          await wsService.connect();
        }
        
        if (isMountedRef.current && endpointId) {
          // Subscribe to this endpoint
          wsService.subscribeToEndpoint(endpointId);
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        if (isMountedRef.current) {
          addToast('Failed to connect real-time updates', 'error');
        }
      }
    };

    setupWebSocket();

    // Register ONLY the events we need
    wsService.on('endpoint-updated', handleEndpointUpdate);
    wsService.on('connection-status', handleConnectionStatus);
    wsService.on('endpoint-deleted', handleEndpointDeleted);

    return () => {
      isMountedRef.current = false;
      
      if (endpointId) {
        wsService.unsubscribeFromEndpoint(endpointId);
      }
      
      // Remove event listeners
      wsService.off('endpoint-updated', handleEndpointUpdate);
      wsService.off('connection-status', handleConnectionStatus);
      wsService.off('endpoint-deleted', handleEndpointDeleted);
    };
  }, [endpointId, handleEndpointUpdate, handleConnectionStatus, handleEndpointDeleted, addToast]);

  // Check WebSocket connection status on mount
  useEffect(() => {
    if (wsService.isConnected()) {
      setWsConnected(true);
      if (endpointId) {
        wsService.subscribeToEndpoint(endpointId);
      }
    }
  }, [endpointId]);

  // Fetch endpoint details (only once on mount)
  const fetchEndpointDetails = useCallback(async () => {
    if (!endpointId) return;
    
    try {
      const data = await getEndpointById(endpointId);
      if (isMountedRef.current) {
        setEndpoint(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch endpoint details';
      if (isMountedRef.current) {
        setError(errorMessage);
        addToast('Failed to load endpoint details', 'error');
      }
    }
  }, [endpointId, addToast]);

  // Fetch health checks with pagination and status filter
  const fetchHealthChecks = useCallback(async () => {
    if (!endpointId) return;

    try {
      const response = await getAllHealthChecks(endpointId, page, limit, statusFilter);
      
      if (isMountedRef.current) {
        setChecks(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health checks';
      if (isMountedRef.current) {
        setError(errorMessage);
        addToast('Failed to load health check history', 'error');
      }
    }
  }, [endpointId, page, limit, statusFilter, addToast]);

  // Initial load (only once)
  useEffect(() => {
    const loadData = async () => {
      if (!endpointId) {
        navigate('/dashboard');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchEndpointDetails(),
          fetchHealthChecks()
        ]);
      } catch {
        // Error already handled in individual fetches
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [endpointId, navigate, fetchEndpointDetails, fetchHealthChecks]);

  // Handle page/limit/status changes
  useEffect(() => {
    if (!endpointId || loading || !isMountedRef.current) {
      return;
    }

    const pageChanged = prevPageRef.current !== page;
    const limitChanged = prevLimitRef.current !== limit;
    const statusChanged = prevStatusFilterRef.current !== statusFilter;
    
    if (!pageChanged && !limitChanged && !statusChanged) {
      return;
    }

    prevPageRef.current = page;
    prevLimitRef.current = limit;
    prevStatusFilterRef.current = statusFilter;

    if (fetchingPageRef.current) {
      return;
    }

    const fetchPageData = async () => {
      fetchingPageRef.current = true;
      
      try {
        const response = await getAllHealthChecks(endpointId, page, limit, statusFilter);
        
        if (isMountedRef.current) {
          setChecks(response.data);
          setTotal(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
        }
      } catch {
        addToast('Failed to load page data', 'error');
      } finally {
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchingPageRef.current = false;
          }
        }, 100);
      }
    };
    
    fetchPageData();
  }, [page, limit, statusFilter, endpointId, loading, addToast]);

  // Action handlers (same as before)
  const handleEdit = () => navigate(`/endpoints/${endpointId}/edit`);

  const handleToggle = async () => {
    if (!endpointId || isToggling) return;
    
    setIsToggling(true);
    try {
      await toggleEndpoint(endpointId);
      
      if (isMountedRef.current) {
        setEndpoint(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        
        if (endpoint?.isActive) {
          wsService.unsubscribeFromEndpoint(endpointId);
        } else {
          wsService.subscribeToEndpoint(endpointId);
        }
        
        const action = endpoint?.isActive ? 'paused' : 'resumed';
        addToast(`Endpoint ${action} successfully`, 'success');
      }
    } catch (error) {
      addToast(`Failed to toggle endpoint: ${(error as Error).message || 'Unknown error'}`, 'error');
    } finally {
      if (isMountedRef.current) setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.endpointId || isDeleting) return;
    
    setIsDeleting(true);
    try {
      wsService.unsubscribeFromEndpoint(deleteModal.endpointId);
      await deleteEndpoint(deleteModal.endpointId);
      
      if (isMountedRef.current) {
        setDeleteModal({ isOpen: false, endpointId: null });
        addToast('Endpoint deleted successfully', 'success');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error) {
      addToast(`Failed to delete endpoint: ${(error as Error).message || 'Unknown error'}`, 'error');
      if (isMountedRef.current) setIsDeleting(false);
    }
  };

  const handleManualCheck = async () => {
    if (!endpointId) return;
    
    try {
      await triggerManualCheck(endpointId);
      addToast('Manual check triggered successfully', 'success');
    } catch (error) {
      addToast(`Failed to trigger manual check: ${(error as Error).message || 'Unknown error'}`, 'error');
    }
  };

  const handlePageChange = (newPage: number) => newPage !== page && setPage(newPage);
  const handleLimitChange = (newLimit: number) => {
    if (newLimit !== limit) {
      setLimit(newLimit);
      setPage(1);
    }
  };
  const handleStatusFilterChange = (newStatus: string) => {
    if (newStatus !== statusFilter) {
      setStatusFilter(newStatus);
      setPage(1);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !endpoint) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Endpoint</h2>
          <p className="text-gray-400 mb-6">{error || 'Endpoint not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => !isDeleting && setDeleteModal({ isOpen: false, endpointId: null })}
        onConfirm={handleDelete}
        title="Delete Monitor"
        message="Are you sure you want to delete this monitor? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with Connection Status */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {wsConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">Offline</span>
                </>
              )}
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Endpoint Details Card */}
        <EndpointDetailsCard
          endpoint={endpoint}
          onEdit={handleEdit}
          onDelete={() => setDeleteModal({ isOpen: true, endpointId: endpoint._id })}
          onManualCheck={handleManualCheck}
          onToggle={handleToggle}
        />

        {/* Health Checks Table */}
        <div className="relative">
          {wsConnected && (
            <div className="absolute -top-3 right-4 z-10">
              <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Real-time updates active
              </span>
            </div>
          )}
          
          <HealthChecksTable
            checks={checks}
            total={total}
            page={page}
            totalPages={totalPages}
            limit={limit}
            statusFilter={statusFilter}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onStatusFilterChange={handleStatusFilterChange}
            loading={false}
            endpointName={endpoint.name}
            showEndpointInfo={false}
          />
        </div>
      </div>
    </div>
  );
};

export default EndpointHistoryPage;
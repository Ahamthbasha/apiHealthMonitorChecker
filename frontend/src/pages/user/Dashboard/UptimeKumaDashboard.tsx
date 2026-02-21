import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import {
  toggleEndpoint,
  deleteEndpoint,
  getEndpointStats,
  getEndpointHistory,
  triggerManualCheck,
  getRecentHealthChecks,
} from "../../../api/userAction/userAction";
import { wsService } from "../../../services/websocketService";

import type {
  EndpointStatus,
  EndpointStats,
  ToastItem,
  TimeRange,
  HealthCheck,
} from "../../../types/healthCheck";
import type { HealthCheckDTO } from "../../../types/interface/healthCheckInterface";

import Sidebar from "../../../component/userComponent/DashboardComponent/Sidebar";
import StatsBar from "../../../component/userComponent/DashboardComponent/Statsbar";
import EndpointHeader from "../../../component/userComponent/DashboardComponent/EndpointHeader";
import ResponseTimeChart from "../../../component/userComponent/DashboardComponent/ResponseTimeChart";
import RecentHealthChecks from "../../../component/userComponent/DashboardComponent/RecentHealthChecks";
import EmptyState from "../../../component/userComponent/DashboardComponent/EmptyState";
import { ToastContainer } from "../../../component/userComponent/DashboardComponent/Toast";
import ConfirmationModal from "../../../component/common/ConfirmationModal";

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-green-500 animate-spin" />
      <p className="text-gray-500 text-sm">Loading monitors...</p>
    </div>
  </div>
);

const enrichHealthCheckWithDisplayFields = (
  check: HealthCheck,
): HealthCheck => {
  if (check.formattedTime && check.formattedDateTime && check.timestamp) {
    return check;
  }

  const checkedAtDate = new Date(check.checkedAt);
  return {
    ...check,
    timestamp: checkedAtDate.getTime(),
    formattedTime: checkedAtDate.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    }),
    formattedDateTime: checkedAtDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  };
};

// Extended interface for stats with endpointId and isActive
interface ExtendedEndpointStats extends EndpointStats {
  endpointId?: string;
  latestResponseTime?: number;
  latestStatus?: string;
  latestCheckedAt?: string;
  isActive?: boolean;
}

const UptimeKumaDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [statuses, setStatuses] = useState<EndpointStatus[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<EndpointStatus | null>(null);
  const [stats, setStats] = useState<ExtendedEndpointStats | null>(null);
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [recentChecks, setRecentChecks] = useState<HealthCheckDTO[]>([]);
  const [recentChecksLoading, setRecentChecksLoading] = useState(false);
  const [recentChecksError, setRecentChecksError] = useState<string | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    endpointId: string | null;
  }>({
    isOpen: false,
    endpointId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [lastSelectedEndpointId, setLastSelectedEndpointId] = useState<
    string | null
  >(null);
  const [lastTimeRange, setLastTimeRange] = useState<TimeRange>("24h");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isFetchingRef = useRef(false);
  const initialFetchDoneRef = useRef(false);
  const selectedEndpointRef = useRef(selectedEndpoint);
  const statusesRef = useRef(statuses);

  useEffect(() => {
    selectedEndpointRef.current = selectedEndpoint;
  }, [selectedEndpoint]);
  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  const addToast = useCallback((message: string, type: ToastItem["type"]) => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now().toString(), message, type },
    ]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Function to update stats with latest check data
  const updateStatsWithLatestCheck = useCallback(
    (endpointId: string, check: HealthCheckDTO) => {
      setStats((prevStats) => {
        if (!prevStats) return prevStats;

        // Create updated stats object
        const updatedStats = {
          ...prevStats,
          endpointId,
          latestResponseTime: check.responseTime,
          latestStatus: check.status,
          latestCheckedAt: check.checkedAt,
          // Update averages
          totalChecks: prevStats.totalChecks + 1,
          successCount:
            check.status === "success"
              ? prevStats.successCount + 1
              : prevStats.successCount,
          failureCount:
            check.status === "failure"
              ? prevStats.failureCount + 1
              : prevStats.failureCount,
          timeoutCount:
            check.status === "timeout"
              ? prevStats.timeoutCount + 1
              : prevStats.timeoutCount,
          // Recalculate avg response time
          avgResponseTime:
            (prevStats.avgResponseTime * prevStats.totalChecks +
              check.responseTime) /
            (prevStats.totalChecks + 1),
          // Recalculate uptime
          uptime:
            ((check.status === "success"
              ? prevStats.successCount + 1
              : prevStats.successCount) /
              (prevStats.totalChecks + 1)) *
            100,
        };

        // Also update the statuses array with the new uptime to keep them in sync
        setStatuses((prevStatuses) =>
          prevStatuses.map((s) =>
            s.endpointId === endpointId
              ? {
                  ...s,
                  uptime: updatedStats.uptime,
                  totalChecks: updatedStats.totalChecks,
                  lastResponseTime: check.responseTime,
                  lastChecked: check.checkedAt,
                  status:
                    check.status === "success"
                      ? "up"
                      : check.status === "timeout"
                        ? "degraded"
                        : "down",
                }
              : s,
          ),
        );

        return updatedStats;
      });
    },
    [],
  );

  // Fetch recent checks for the selected endpoint
  const fetchRecentChecks = useCallback(async (endpointId: string) => {
    if (!endpointId) return;

    try {
      setRecentChecksLoading(true);
      setRecentChecksError(null);

      const data = await getRecentHealthChecks(endpointId, 10);
      setRecentChecks(data);
    } catch (err) {
      setRecentChecksError(
        err instanceof Error ? err.message : "Failed to fetch recent checks",
      );
      console.error("Error fetching recent health checks:", err);
    } finally {
      setRecentChecksLoading(false);
    }
  }, []);

  // Main WebSocket setup
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      wsService
        .connect()
        .then(() => wsService.requestInitialData())
        .catch(() =>
          addToast("Failed to connect to real-time updates", "error"),
        );
    }

    wsService.on("connection-status", ({ connected }) => {
      setIsConnected(connected);
      if (connected) addToast("Connected to real-time updates", "success");
      else addToast("Disconnected from real-time updates", "warning");
    });

    wsService.on("initial-data", (data) => {
      setStatuses(data.statuses);

      const enrichedHistory: HealthCheck[] = [];
      Object.values(data.recentChecks).forEach((checks) => {
        checks.forEach((check) =>
          enrichedHistory.push(enrichHealthCheckWithDisplayFields(check)),
        );
      });

      if (data.statuses.length > 0 && !selectedEndpointRef.current) {
        const firstEndpoint = data.statuses[0];
        setSelectedEndpoint(firstEndpoint);
        setLastSelectedEndpointId(firstEndpoint.endpointId);
        wsService.subscribeToEndpoint(firstEndpoint.endpointId);
        fetchRecentChecks(firstEndpoint.endpointId);
      }
      setLoading(false);
      setInitialDataLoaded(true);
    });

    wsService.on("endpoint-updated", ({ endpointId, check }) => {
      // Update statuses list with new uptime calculation
      setStatuses((prev) =>
        prev.map((s) => {
          if (s.endpointId !== endpointId) return s;
          
          const newTotalChecks = s.totalChecks + 1;
          const newSuccessCount = check.status === 'success' 
            ? (s.uptime * s.totalChecks / 100) + 1 
            : (s.uptime * s.totalChecks / 100);
          
          const newUptime = (newSuccessCount / newTotalChecks) * 100;
          
          return {
            ...s,
            lastResponseTime: check.responseTime,
            lastChecked: check.checkedAt,
            uptime: newUptime,
            totalChecks: newTotalChecks,
            status: s.isActive 
              ? (check.status === "success"
                  ? "up"
                  : check.status === "timeout"
                    ? "degraded"
                    : "down")
              : "inactive",
          };
        }),
      );

      // Update selected endpoint and stats if this is the selected one
      if (selectedEndpointRef.current?.endpointId === endpointId && selectedEndpointRef.current.isActive) {
        // Update the selected endpoint object
        setSelectedEndpoint((prev) => {
          if (!prev) return null;
          
          const newTotalChecks = prev.totalChecks + 1;
          const newSuccessCount = check.status === 'success' 
            ? (prev.uptime * prev.totalChecks / 100) + 1 
            : (prev.uptime * prev.totalChecks / 100);
          
          const newUptime = (newSuccessCount / newTotalChecks) * 100;
          
          return {
            ...prev,
            lastResponseTime: check.responseTime,
            lastChecked: check.checkedAt,
            uptime: newUptime,
            totalChecks: newTotalChecks,
            status: check.status === "success"
              ? "up"
              : check.status === "timeout"
                ? "degraded"
                : "down",
          };
        });

        // Update history
        setHistory((prev) => {
          const newHistory = [...prev, enrichHealthCheckWithDisplayFields(check)];
          return newHistory.slice(-100);
        });

        // Update recent checks
        setRecentChecks((prev) => {
          if (prev.some((c) => c.id === check.id)) return prev;
          return [check, ...prev].slice(0, 10);
        });

        // Update stats
        updateStatsWithLatestCheck(endpointId, check);
      }

      // Show toast for status change
      const endpoint = statusesRef.current.find(
        (s) => s.endpointId === endpointId,
      );
      if (
        endpoint &&
        endpoint.isActive &&
        endpoint.status !==
          (check.status === "success"
            ? "up"
            : check.status === "timeout"
              ? "degraded"
              : "down")
      ) {
        addToast(
          `${endpoint.name} is now ${check.status.toUpperCase()}`,
          check.status === "success" ? "success" : "warning",
        );
      }
    });

    wsService.on("live-stats", ({ statuses: newStatuses }) => {
      setStatuses(newStatuses);
      if (selectedEndpointRef.current) {
        const updated = newStatuses.find(
          (s) => s.endpointId === selectedEndpointRef.current?.endpointId,
        );
        if (updated) {
          setSelectedEndpoint(updated);
          // Also update stats uptime to match
          setStats((prev) => prev ? { ...prev, uptime: updated.uptime } : null);
        }
      }
    });

    wsService.on("threshold-alert", (alert) =>
      addToast(alert.message, "warning"),
    );
    wsService.on("error", (error) =>
      addToast(error.message || "WebSocket error occurred", "error"),
    );

    wsService.on("endpoint-deleted", ({ endpointId }) => {
      setStatuses((prev) => prev.filter((s) => s.endpointId !== endpointId));
      if (selectedEndpointRef.current?.endpointId === endpointId) {
        setSelectedEndpoint(null);
        setLastSelectedEndpointId(null);
        setStats(null);
        setHistory([]);
        setRecentChecks([]);
        initialFetchDoneRef.current = false;
      }
      addToast("Endpoint was deleted", "info");
    });

    return () => wsService.disconnect();
  }, [addToast, fetchRecentChecks, updateStatsWithLatestCheck]);

  // Subscribe to selected endpoint
  useEffect(() => {
    if (
      selectedEndpoint &&
      initialDataLoaded &&
      selectedEndpoint.endpointId !== lastSelectedEndpointId
    ) {
      wsService.subscribeToEndpoint(selectedEndpoint.endpointId);
      setLastSelectedEndpointId(selectedEndpoint.endpointId);
      initialFetchDoneRef.current = false;
    }
  }, [selectedEndpoint, initialDataLoaded, lastSelectedEndpointId]);

  // Fetch recent checks when selected endpoint changes
  useEffect(() => {
    if (selectedEndpoint?.endpointId) {
      fetchRecentChecks(selectedEndpoint.endpointId);
    }
  }, [selectedEndpoint?.endpointId, fetchRecentChecks]);

  // Fetch endpoint details
  useEffect(() => {
    if (!selectedEndpoint || !initialDataLoaded) return;

    const fetchEndpointDetails = async () => {
      if (isFetchingRef.current) return;

      const endpointChanged =
        selectedEndpoint.endpointId !== lastSelectedEndpointId;
      const timeRangeChanged = timeRange !== lastTimeRange;

      if (!initialFetchDoneRef.current || endpointChanged || timeRangeChanged) {
        isFetchingRef.current = true;

        try {
          const hoursMap: Record<TimeRange, number> = {
            "1h": 1,
            "24h": 24,
            "7d": 168,
            "30d": 720,
          };

          const [statsData, historyData] = await Promise.all([
            getEndpointStats(selectedEndpoint.endpointId, hoursMap[timeRange]),
            getEndpointHistory(selectedEndpoint.endpointId, 100),
          ]);

          // Use the uptime from statsData, but ensure it matches the selected endpoint's uptime
          // This keeps them in sync
          const enrichedStats: ExtendedEndpointStats = {
            ...statsData,
            endpointId: selectedEndpoint.endpointId,
            latestResponseTime: selectedEndpoint.lastResponseTime,
            latestStatus:
              selectedEndpoint.status === "up"
                ? "success"
                : selectedEndpoint.status === "degraded"
                  ? "timeout"
                  : "failure",
            latestCheckedAt: selectedEndpoint.lastChecked,
            isActive: selectedEndpoint.isActive,
            // Use the uptime from statsData but also update selectedEndpoint if needed
            uptime: statsData.uptime,
          };

          setStats(enrichedStats);
          
          // Update the selected endpoint's uptime to match stats
          if (Math.abs(selectedEndpoint.uptime - statsData.uptime) > 0.01) {
            setSelectedEndpoint(prev => 
              prev ? { ...prev, uptime: statsData.uptime } : null
            );
            
            // Also update in statuses array
            setStatuses(prev =>
              prev.map(s =>
                s.endpointId === selectedEndpoint.endpointId
                  ? { ...s, uptime: statsData.uptime }
                  : s
              )
            );
          }
          
          setHistory(historyData.map(enrichHealthCheckWithDisplayFields));
          setLastTimeRange(timeRange);
          initialFetchDoneRef.current = true;
        } catch {
          addToast("Failed to load endpoint details", "error");
        } finally {
          setTimeout(() => {
            isFetchingRef.current = false;
          }, 500);
        }
      }
    };

    fetchEndpointDetails();
  }, [
    selectedEndpoint,
    timeRange,
    initialDataLoaded,
    addToast,
    lastSelectedEndpointId,
    lastTimeRange,
  ]);

  const handleSelectEndpoint = (status: EndpointStatus) => {
    if (status.endpointId !== selectedEndpoint?.endpointId) {
      setSelectedEndpoint(status);
      setStats(null);
      initialFetchDoneRef.current = false;
    }
    setMobileMenuOpen(false);
  };

  const handleTimeRangeChange = (newTimeRange: TimeRange) => {
    if (newTimeRange !== timeRange) {
      setTimeRange(newTimeRange);
      initialFetchDoneRef.current = false;
    }
  };

  const handleManualCheck = async () => {
    if (!selectedEndpoint) return;
    try {
      await triggerManualCheck(selectedEndpoint.endpointId);
      addToast("Manual check triggered", "success");
    } catch {
      addToast("Failed to trigger manual check", "error");
    }
  };

  const handleToggle = async (endpointId: string) => {
    try {
      await toggleEndpoint(endpointId);
      setStatuses((prev) =>
        prev.map((s) =>
          s.endpointId === endpointId
            ? {
                ...s,
                isActive: !s.isActive,
                status: !s.isActive ? s.status : 'inactive',
              }
            : s,
        ),
      );
      
      if (selectedEndpoint?.endpointId === endpointId) {
        setSelectedEndpoint((prev) =>
          prev
            ? {
                ...prev,
                isActive: !prev.isActive,
                status: !prev.isActive ? prev.status : 'inactive',
              }
            : null,
        );
        
        if (selectedEndpoint.isActive) {
          setStats(null);
          setHistory([]);
          setRecentChecks([]);
        }
      }
      
      const endpoint = statuses.find(s => s.endpointId === endpointId);
      const endpointName = endpoint?.name || 'Endpoint';
      const isCurrentlyActive = endpoint?.isActive;
      addToast(`${endpointName} ${isCurrentlyActive ? 'paused' : 'resumed'} successfully`, "success");
    } catch {
      addToast("Failed to toggle endpoint", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.endpointId) return;
    setIsDeleting(true);

    try {
      wsService.unsubscribeFromEndpoint(deleteModal.endpointId);
      await deleteEndpoint(deleteModal.endpointId);
      setStatuses((prev) =>
        prev.filter((s) => s.endpointId !== deleteModal.endpointId),
      );

      if (selectedEndpoint?.endpointId === deleteModal.endpointId) {
        setSelectedEndpoint(null);
        setLastSelectedEndpointId(null);
        setStats(null);
        setHistory([]);
        setRecentChecks([]);
        initialFetchDoneRef.current = false;
      }

      setDeleteModal({ isOpen: false, endpointId: null });
      addToast("Endpoint deleted successfully", "success");
    } catch (error) {
      addToast(
        `Failed to delete endpoint: ${(error as Error).message || "Unknown error"}`,
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    wsService.disconnect();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) return <LoadingSpinner />;

  const getIntervalText = (intervalSeconds: number): string => {
    if (intervalSeconds === 60) return "1 minute";
    if (intervalSeconds === 300) return "5 minutes";
    if (intervalSeconds === 900) return "15 minutes";
    return `${intervalSeconds} seconds`;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row font-sans">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
          </div>
          <span className="text-white font-bold text-lg">API Monitor</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`md:hidden fixed top-[57px] left-0 bottom-0 z-40 w-72 bg-gray-900 border-r border-gray-700/50 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          statuses={statuses}
          selectedEndpoint={selectedEndpoint}
          searchTerm={searchTerm}
          isConnected={isConnected}
          collapsed={false}
          userName={localStorage.getItem("userName") || "User"}
          onSelectEndpoint={handleSelectEndpoint}
          onAddNew={() => {
            navigate("/endpoints/create");
            setMobileMenuOpen(false);
          }}
          onLogout={handleLogout}
          onSearchChange={setSearchTerm}
          onToggleCollapse={() => {}}
          isMobile={true}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          statuses={statuses}
          selectedEndpoint={selectedEndpoint}
          searchTerm={searchTerm}
          isConnected={isConnected}
          collapsed={sidebarCollapsed}
          userName={localStorage.getItem("userName") || "User"}
          onSelectEndpoint={handleSelectEndpoint}
          onAddNew={() => navigate("/endpoints/create")}
          onLogout={handleLogout}
          onSearchChange={setSearchTerm}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          isMobile={false}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto min-h-screen md:min-h-0">
        {selectedEndpoint && stats ? (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <EndpointHeader
              endpoint={selectedEndpoint}
              isConnected={isConnected}
              onManualCheck={handleManualCheck}
              onToggle={() => handleToggle(selectedEndpoint.endpointId)}
              onEdit={() =>
                navigate(`/endpoints/${selectedEndpoint.endpointId}/edit`)
              }
              onDelete={() =>
                setDeleteModal({
                  isOpen: true,
                  endpointId: selectedEndpoint.endpointId,
                })
              }
            />

            {/* Uptime History Section */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Uptime History (Last {history.length} checks)
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-400">
                    Check interval: {getIntervalText(selectedEndpoint.interval)} •
                    Total checks: {selectedEndpoint.totalChecks || 0}
                  </p>
                  <span
                    className={`text-xs font-bold font-mono ${
                      selectedEndpoint.uptime >= 99 
                        ? "text-green-400" 
                        : selectedEndpoint.uptime >= 95 
                          ? "text-yellow-400" 
                          : "text-red-400"
                    }`}
                  >
                    {selectedEndpoint.uptime.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Chart bars */}
              <div className="flex items-end gap-px w-full overflow-x-auto pb-1">
                <div className="flex items-end gap-px min-w-full">
                  {history.length > 0 ? (
                    history.slice(-90).map((check, i) => (
                      <div
                        key={check.id || i}
                        className={`flex-1 rounded-sm transition-all min-w-[3px] h-8 ${
                          check.status === "success"
                            ? "bg-green-500 hover:bg-green-400"
                            : check.status === "timeout"
                              ? "bg-yellow-500 hover:bg-yellow-400"
                              : "bg-red-500 hover:bg-red-400"
                        }`}
                        title={`${check.status} — ${check.responseTime}ms at ${check.formattedDateTime || check.checkedAt}`}
                      />
                    ))
                  ) : (
                    Array.from({ length: 90 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-gray-700 h-8 min-w-[3px]"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Date labels */}
              <div className="flex flex-col sm:flex-row justify-between mt-2 text-xs text-gray-600 gap-2">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider">
                    Oldest
                  </span>
                  <span className="text-gray-300 font-mono text-[10px] sm:text-xs">
                    {history.length > 0
                      ? history[0]?.formattedDateTime?.split(",")[0] || "—"
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gray-500 text-[10px] uppercase tracking-wider">
                    Latest
                  </span>
                  <span className="text-gray-300 font-mono text-[10px] sm:text-xs">
                    {history.length > 0
                      ? history[history.length - 1]?.formattedDateTime?.split(",")[0] || "Now"
                      : "Now"}
                  </span>
                </div>
              </div>
            </div>

            <StatsBar
              stats={stats}
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 sm:p-5">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Response Time
              </h2>
              <ResponseTimeChart
                data={history}
                timeRange={timeRange}
                height={200}
              />
            </div>

            <RecentHealthChecks
              checks={recentChecks}
              loading={recentChecksLoading}
              error={recentChecksError}
              endpointName={selectedEndpoint.name}
              isActive={selectedEndpoint.isActive}
            />
          </div>
        ) : (
          <EmptyState onAddNew={() => navigate("/endpoints/create")} />
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          if (!isDeleting) setDeleteModal({ isOpen: false, endpointId: null });
        }}
        onConfirm={handleDelete}
        title="Delete Monitor"
        message="Are you sure you want to delete this monitor? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default UptimeKumaDashboard;
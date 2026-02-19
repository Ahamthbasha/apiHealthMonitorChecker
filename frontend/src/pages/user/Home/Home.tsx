import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../../redux/store";

export default function Home() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  const stats = {
    totalApis: 12,
    operational: 10,
    degraded: 1,
    down: 1,
  };

  const recentChecks = [
    { id: 1, name: "Payment API", status: "up", responseTime: 245, lastChecked: "2 min ago" },
    { id: 2, name: "User Service", status: "up", responseTime: 123, lastChecked: "2 min ago" },
    { id: 3, name: "Notification API", status: "degraded", responseTime: 1890, lastChecked: "5 min ago" },
    { id: 4, name: "Database Service", status: "up", responseTime: 89, lastChecked: "2 min ago" },
    { id: 5, name: "Analytics API", status: "down", responseTime: undefined, lastChecked: "10 min ago" },
    { id: 6, name: "Auth Service", status: "up", responseTime: 156, lastChecked: "2 min ago" },
  ];

  const getStatusDot = (status: string) => {
    switch (status) {
      case "up": return "bg-green-500";
      case "degraded": return "bg-yellow-500";
      case "down": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "up": return "Operational";
      case "degraded": return "Degraded";
      case "down": return "Down";
      default: return "Unknown";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "up": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "degraded": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "down": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms < 300) return "text-green-400";
    if (ms < 1000) return "text-yellow-400";
    return "text-red-400";
  };

  const overallHealth = Math.round((stats.operational / stats.totalApis) * 100);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">

      {/* Hero */}
      <div className="border-b border-gray-700/50 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                API Health Monitor
              </h1>
            </div>
            <p className="text-gray-400 text-base">
              {user.name ? `Welcome back, ${user.name}` : "Real-time API status dashboard"}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-8">
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-white font-mono">{stats.totalApis}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Total</p>
              </div>
              <div className="bg-gray-800/60 border border-green-500/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-400 font-mono">{stats.operational}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Up</p>
              </div>
              <div className="bg-gray-800/60 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-yellow-400 font-mono">{stats.degraded}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Degraded</p>
              </div>
              <div className="bg-gray-800/60 border border-red-500/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-400 font-mono">{stats.down}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Down</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Status Cards */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Operational", count: stats.operational, color: "green", sub: "Services running normally" },
              { label: "Degraded", count: stats.degraded, color: "yellow", sub: "Experiencing issues" },
              { label: "Down", count: stats.down, color: "red", sub: "Services unavailable" },
            ].map(({ label, count, color, sub }) => (
              <div
                key={label}
                className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
                  <span className="text-sm font-medium text-gray-300">{label}</span>
                </div>
                <p className={`text-3xl font-bold font-mono text-${color}-400`}>{count}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Checks Table */}
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-700/50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Recent API Checks
            </h3>
          </div>
          <div className="divide-y divide-gray-700/30">
            {recentChecks.map((api) => (
              <div
                key={api.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-700/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusDot(api.status)}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{api.name}</p>
                    <p className="text-xs text-gray-500">Last checked {api.lastChecked}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {api.responseTime !== undefined && (
                    <span className={`text-sm font-mono font-semibold ${getResponseTimeColor(api.responseTime)}`}>
                      {api.responseTime}ms
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusBadge(api.status)}`}>
                    {getStatusLabel(api.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Uptime bar */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Today's Uptime
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${overallHealth}%` }}
                />
              </div>
              <span className="text-sm font-mono font-bold text-green-400">{overallHealth}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">Average response time: 245ms</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Quick Actions
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => navigate("/add-api")}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                + Add New API
              </button>
              <button
                onClick={() => navigate("/reports")}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                View Reports
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                Configure Alerts
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/20 border border-gray-700/30 rounded-lg">
          <div className="flex items-center gap-4">
            {[
              { color: "bg-green-500", label: "Operational" },
              { color: "bg-yellow-500", label: "Degraded" },
              { color: "bg-red-500", label: "Down" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-600">Last updated: Just now</span>
        </div>

      </div>
    </div>
  );
}
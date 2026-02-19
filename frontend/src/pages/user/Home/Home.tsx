import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../../redux/store";

export default function Home() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  // Static data for display only
  const stats = {
    totalApis: 12,
    operational: 10,
    degraded: 1,
    down: 1
  };

  const recentChecks = [
    { id: 1, name: "Payment API", status: "up", responseTime: 245, lastChecked: "2 min ago" },
    { id: 2, name: "User Service", status: "up", responseTime: 123, lastChecked: "2 min ago" },
    { id: 3, name: "Notification API", status: "degraded", responseTime: 1890, lastChecked: "5 min ago" },
    { id: 4, name: "Database Service", status: "up", responseTime: 89, lastChecked: "2 min ago" },
    { id: 5, name: "Analytics API", status: "down", responseTime: undefined, lastChecked: "10 min ago" },
    { id: 6, name: "Auth Service", status: "up", responseTime: 156, lastChecked: "2 min ago" }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "up": return "bg-green-500";
      case "degraded": return "bg-yellow-500";
      case "down": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "up": return "Operational";
      case "degraded": return "Degraded";
      case "down": return "Down";
      default: return "Unknown";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case "up": return "bg-green-100 text-green-800";
      case "degraded": return "bg-yellow-100 text-yellow-800";
      case "down": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              API Health Monitor
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              {user.name ? `Welcome back, ${user.name}!` : "Real-time API status dashboard"}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.totalApis}</div>
                <div className="text-sm text-blue-100">Total APIs</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-3xl font-bold text-green-300">{stats.operational}</div>
                <div className="text-sm text-blue-100">Operational</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-300">{stats.degraded}</div>
                <div className="text-sm text-blue-100">Degraded</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
                <div className="text-3xl font-bold text-red-300">{stats.down}</div>
                <div className="text-sm text-blue-100">Down</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            System Status
          </h2>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Operational</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.operational}</p>
              <p className="text-sm text-gray-500">Services running normally</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Degraded</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.degraded}</p>
              <p className="text-sm text-gray-500">Experiencing issues</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Down</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.down}</p>
              <p className="text-sm text-gray-500">Services unavailable</p>
            </div>
          </div>

          {/* Recent Checks Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Recent API Checks</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentChecks.map((api) => (
                <div key={api.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(api.status)}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{api.name}</p>
                      <p className="text-sm text-gray-500">Last checked {api.lastChecked}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {api.responseTime && (
                      <span className="text-sm text-gray-600">{api.responseTime}ms</span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(api.status)}`}>
                      {getStatusText(api.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uptime History (Simplified) */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Uptime</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '99.5%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">99.5%</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Average response time: 245ms</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/add-api")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ➕ Add New API
                </button>
                <button
                  onClick={() => navigate("/reports")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  📊 View Reports
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ⚙️ Configure Alerts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Operational</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Degraded</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Down</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: Just now
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
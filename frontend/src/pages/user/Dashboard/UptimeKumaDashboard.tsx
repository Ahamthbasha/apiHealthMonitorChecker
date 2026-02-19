// // src/pages/user/Dashboard/UptimeKumaDashboard.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Plus,
//   Search,
//   Power,
//   Edit,
//   Trash2,
//   Activity,
//   BarChart2,
//   Clock,
//   CheckCircle,
//   XCircle,
//   RefreshCw,
//   Play,
//   User,
//   LogOut,
//   Menu,
// } from 'lucide-react';
// import { getUserEndpoints, toggleEndpoint, deleteEndpoint } from '../../../api/userAction/userAction';
// import { getUserEndpointsStatus, getEndpointStats, getEndpointHistory, triggerManualCheck } from '../../../api/userAction/userAction';
// import type { EndpointStatus } from '../../../types/interface/apiInterface';
// import type {EndpointStats, HealthCheck} from '../../../types/interface/healthCheckInterface'
// import ResponseTimeChart from '../../../component/userComponent/ResponseTimeChart';
// import HealthStatusBadge from '../../../component/userComponent/HealthStatusBadge';
// import ConfirmationModal from '../../../component/common/ConfirmationModal';
// import { formatDistanceToNow, format } from 'date-fns';

// // Loading Spinner
// const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
//   const sizeClasses = {
//     sm: 'w-4 h-4',
//     md: 'w-8 h-8',
//     lg: 'w-12 h-12',
//   };

//   return (
//     <div className="flex justify-center items-center">
//       <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
//     </div>
//   );
// };

// // Stat Card for right panel
// const StatCard: React.FC<{
//   label: string;
//   value: string | number;
//   subValue?: string;
//   icon: React.ReactNode;
//   color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
//   trend?: number;
// }> = ({ label, value, subValue, icon, color, trend }) => {
//   const colorClasses = {
//     blue: 'bg-blue-100 text-blue-600',
//     green: 'bg-green-100 text-green-600',
//     red: 'bg-red-100 text-red-600',
//     yellow: 'bg-yellow-100 text-yellow-600',
//     purple: 'bg-purple-100 text-purple-600',
//     orange: 'bg-orange-100 text-orange-600',
//   };

//   return (
//     <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between">
//         <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
//           {icon}
//         </div>
//         {trend !== undefined && (
//           <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//             {trend > 0 ? '+' : ''}{trend}%
//           </span>
//         )}
//       </div>
//       <div className="mt-3">
//         <p className="text-sm text-gray-600">{label}</p>
//         <p className="text-xl font-bold text-gray-900">{value}</p>
//         {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
//       </div>
//     </div>
//   );
// };

// // Monitor Item for sidebar
// const MonitorItem: React.FC<{
//   endpoint: EndpointStatus;
//   isSelected: boolean;
//   onSelect: () => void;
//   onToggle: () => void;
//   onEdit: () => void;
//   onDelete: () => void;
// }> = ({ endpoint, isSelected, onSelect, onToggle, onEdit, onDelete }) => {
//   return (
//     <div
//       className={`group relative rounded-lg transition-all cursor-pointer ${
//         isSelected 
//           ? 'bg-blue-50 border-blue-200 shadow-sm' 
//           : 'hover:bg-gray-50 border-transparent'
//       } border`}
//       onClick={onSelect}
//     >
//       <div className="p-3">
//         <div className="flex items-start justify-between">
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center space-x-2">
//               <HealthStatusBadge status={endpoint.status} size="sm" />
//               <h3 className="font-medium text-gray-900 truncate">{endpoint.name}</h3>
//             </div>
//             <p className="text-xs text-gray-500 truncate mt-1">{endpoint.url}</p>
//             <div className="flex items-center space-x-3 mt-2 text-xs">
//               <span className="text-gray-600">{endpoint.responseTime}ms</span>
//               <span className="text-gray-400">•</span>
//               <span className="text-gray-600">{endpoint.uptime.toFixed(1)}%</span>
//             </div>
//           </div>
          
//           {/* Action buttons - appear on hover */}
//           <div className="hidden group-hover:flex items-center space-x-1 absolute right-2 top-2 bg-inherit">
//             <button
//               onClick={(e) => { e.stopPropagation(); onToggle(); }}
//               className={`p-1 rounded hover:bg-gray-200 ${
//                 endpoint.status === 'down' ? 'text-green-600' : 'text-gray-600'
//               }`}
//               title={endpoint.status === 'down' ? 'Activate' : 'Deactivate'}
//             >
//               <Power className="w-3 h-3" />
//             </button>
//             <button
//               onClick={(e) => { e.stopPropagation(); onEdit(); }}
//               className="p-1 rounded hover:bg-gray-200 text-gray-600"
//               title="Edit"
//             >
//               <Edit className="w-3 h-3" />
//             </button>
//             <button
//               onClick={(e) => { e.stopPropagation(); onDelete(); }}
//               className="p-1 rounded hover:bg-gray-200 text-red-600"
//               title="Delete"
//             >
//               <Trash2 className="w-3 h-3" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const UptimeKumaDashboard: React.FC = () => {
//   const navigate = useNavigate();
//   const [statuses, setStatuses] = useState<EndpointStatus[]>([]);
//   const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointStatus | null>(null);
//   const [stats, setStats] = useState<EndpointStats | null>(null);
//   const [history, setHistory] = useState<HealthCheck[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; endpointId: string | null }>({
//     isOpen: false,
//     endpointId: null,
//   });
//   const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
//   const [autoRefresh, setAutoRefresh] = useState(true);

//   // Fetch all data
//   const fetchData = useCallback(async () => {
//     try {
//       // Fetch endpoints and statuses in parallel
//       const [endpointsData, statusesData] = await Promise.all([
//         getUserEndpoints(),
//         getUserEndpointsStatus()
//       ]);
      
//       // Use endpointsData if needed, otherwise just set statuses
//       setStatuses(statusesData);
      
//       // If there's a selected endpoint, update its data
//       if (selectedEndpoint) {
//         const updatedSelected = statusesData.find(s => s.endpointId === selectedEndpoint.endpointId);
//         if (updatedSelected) {
//           setSelectedEndpoint(updatedSelected);
          
//           // Fetch stats and history for selected endpoint
//           const hoursMap = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
//           const [statsData, historyData] = await Promise.all([
//             getEndpointStats(selectedEndpoint.endpointId, hoursMap[timeRange]),
//             getEndpointHistory(selectedEndpoint.endpointId, 100)
//           ]);
          
//           setStats(statsData);
//           setHistory(historyData);
//         }
//       } else if (statusesData.length > 0) {
//         // Auto-select first endpoint
//         setSelectedEndpoint(statusesData[0]);
//       }
//     } catch (error) {
//       console.error('Failed to fetch data:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedEndpoint, timeRange]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   useEffect(() => {
//     if (!autoRefresh) return;
    
//     const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
//     return () => clearInterval(interval);
//   }, [autoRefresh, fetchData]);

//   // Handle endpoint selection
//   const handleSelectEndpoint = async (status: EndpointStatus) => {
//     setSelectedEndpoint(status);
    
//     // Fetch stats and history for selected endpoint
//     const hoursMap = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
//     const [statsData, historyData] = await Promise.all([
//       getEndpointStats(status.endpointId, hoursMap[timeRange]),
//       getEndpointHistory(status.endpointId, 100)
//     ]);
    
//     setStats(statsData);
//     setHistory(historyData);
//   };

//   // Handle manual check
//   const handleManualCheck = async () => {
//     if (!selectedEndpoint) return;
    
//     try {
//       await triggerManualCheck(selectedEndpoint.endpointId);
//       await fetchData();
//     } catch (error) {
//       console.error('Failed to trigger manual check:', error);
//     }
//   };

//   // Handle toggle active
//   const handleToggle = async (endpointId: string) => {
//     try {
//       await toggleEndpoint(endpointId);
//       await fetchData();
//     } catch (error) {
//       console.error('Failed to toggle endpoint:', error);
//     }
//   };

//   // Handle delete
//   const handleDelete = async () => {
//     if (!deleteModal.endpointId) return;
    
//     try {
//       await deleteEndpoint(deleteModal.endpointId);
//       await fetchData();
//       setDeleteModal({ isOpen: false, endpointId: null });
      
//       // Clear selected if it was deleted
//       if (selectedEndpoint?.endpointId === deleteModal.endpointId) {
//         setSelectedEndpoint(null);
//       }
//     } catch (error) {
//       console.error('Failed to delete endpoint:', error);
//     }
//   };

//   // Handle logout
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('userName');
//     navigate('/login');
//   };

//   // Filter endpoints based on search
//   const filteredStatuses = statuses.filter(status => 
//     status.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     status.url.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       {/* Left Sidebar */}
//       <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
//         {/* Sidebar Header */}
//         <div className="p-4 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <h1 className={`font-bold text-xl text-gray-900 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
//               API Monitor
//             </h1>
//             <button
//               onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
//               className="p-2 hover:bg-gray-100 rounded-lg"
//             >
//               <Menu className="w-5 h-5 text-gray-600" />
//             </button>
//           </div>
          
//           {!sidebarCollapsed && (
//             <div className="mt-4 space-y-2">
//               {/* Search Bar */}
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <input
//                   type="text"
//                   placeholder="Search monitors..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                 />
//               </div>
              
//               {/* Add New Button */}
//               <button
//                 onClick={() => navigate('/endpoints/create')}
//                 className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
//               >
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add New Monitor
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Monitors List */}
//         <div className="flex-1 overflow-y-auto p-3">
//           {sidebarCollapsed ? (
//             // Collapsed view - show only icons
//             <div className="space-y-3">
//               {filteredStatuses.map((status) => (
//                 <div
//                   key={status.endpointId}
//                   onClick={() => handleSelectEndpoint(status)}
//                   className={`relative p-2 rounded-lg cursor-pointer ${
//                     selectedEndpoint?.endpointId === status.endpointId
//                       ? 'bg-blue-50'
//                       : 'hover:bg-gray-50'
//                   }`}
//                   title={status.name}
//                 >
//                   <div className="flex justify-center">
//                     <div className={`w-2 h-2 rounded-full ${
//                       status.status === 'up' ? 'bg-green-500' :
//                       status.status === 'degraded' ? 'bg-yellow-500' :
//                       'bg-red-500'
//                     }`} />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             // Expanded view - show full items
//             <div className="space-y-2">
//               {filteredStatuses.map((status) => (
//                 <MonitorItem
//                   key={status.endpointId}
//                   endpoint={status}
//                   isSelected={selectedEndpoint?.endpointId === status.endpointId}
//                   onSelect={() => handleSelectEndpoint(status)}
//                   onToggle={() => handleToggle(status.endpointId)}
//                   onEdit={() => navigate(`/endpoints/${status.endpointId}/edit`)}
//                   onDelete={() => setDeleteModal({ isOpen: true, endpointId: status.endpointId })}
//                 />
//               ))}
              
//               {filteredStatuses.length === 0 && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500 text-sm">No monitors found</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Sidebar Footer - User Info */}
//         <div className="p-4 border-t border-gray-200">
//           {sidebarCollapsed ? (
//             <button className="w-full p-2 hover:bg-gray-100 rounded-lg">
//               <User className="w-5 h-5 text-gray-600 mx-auto" />
//             </button>
//           ) : (
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                   <User className="w-4 h-4 text-blue-600" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {localStorage.getItem('userName') || 'User'}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">Free Plan</p>
//                 </div>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <LogOut className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right Main Content */}
//       <div className="flex-1 overflow-y-auto">
//         {selectedEndpoint && stats ? (
//           <div className="p-8">
//             {/* Header */}
//             <div className="flex items-start justify-between mb-6">
//               <div>
//                 <div className="flex items-center space-x-3 mb-2">
//                   <h1 className="text-2xl font-bold text-gray-900">{selectedEndpoint.name}</h1>
//                   <HealthStatusBadge status={selectedEndpoint.status} />
//                 </div>
//                 <div className="flex items-center space-x-4 text-sm">
//                   <span className="text-gray-600">{selectedEndpoint.url}</span>
//                   <span className="text-gray-400">•</span>
//                   <span className="text-gray-600">
//                     Last check: {formatDistanceToNow(new Date(selectedEndpoint.lastChecked), { addSuffix: true })}
//                   </span>
//                 </div>
//               </div>
              
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={handleManualCheck}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
//                 >
//                   <Play className="w-4 h-4 mr-2" />
//                   Check Now
//                 </button>
//                 <button
//                   onClick={() => setAutoRefresh(!autoRefresh)}
//                   className={`p-2 rounded-lg border ${
//                     autoRefresh ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
//                   }`}
//                   title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
//                 >
//                   <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'text-green-600' : 'text-gray-600'}`} />
//                 </button>
//               </div>
//             </div>

//             {/* Stats Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
//               <StatCard
//                 label="Uptime (24h)"
//                 value={`${stats.uptime.toFixed(2)}%`}
//                 icon={<Activity className="w-5 h-5" />}
//                 color="green"
//               />
//               <StatCard
//                 label="Avg Response"
//                 value={`${Math.round(stats.avgResponseTime)}ms`}
//                 icon={<BarChart2 className="w-5 h-5" />}
//                 color="blue"
//               />
//               <StatCard
//                 label="Success"
//                 value={stats.successCount}
//                 subValue={`${((stats.successCount / stats.totalChecks) * 100).toFixed(1)}%`}
//                 icon={<CheckCircle className="w-5 h-5" />}
//                 color="green"
//               />
//               <StatCard
//                 label="Failures"
//                 value={stats.failureCount}
//                 subValue={`${((stats.failureCount / stats.totalChecks) * 100).toFixed(1)}%`}
//                 icon={<XCircle className="w-5 h-5" />}
//                 color="red"
//               />
//               <StatCard
//                 label="Timeouts"
//                 value={stats.timeoutCount}
//                 subValue={`${((stats.timeoutCount / stats.totalChecks) * 100).toFixed(1)}%`}
//                 icon={<Clock className="w-5 h-5" />}
//                 color="orange"
//               />
//             </div>

//             {/* Chart Section */}
//             <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-lg font-semibold text-gray-900">Response Time History</h2>
//                 <div className="flex space-x-2">
//                   {(['1h', '24h', '7d', '30d'] as const).map((range) => (
//                     <button
//                       key={range}
//                       onClick={() => setTimeRange(range)}
//                       className={`px-3 py-1 text-sm rounded-lg transition-colors ${
//                         timeRange === range
//                           ? 'bg-blue-600 text-white'
//                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                       }`}
//                     >
//                       {range}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               <ResponseTimeChart data={history} timeRange={timeRange} height={300} />
//             </div>

//             {/* Recent Checks Table */}
//             <div className="bg-white rounded-xl border border-gray-200">
//               <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//                 <h2 className="text-lg font-semibold text-gray-900">Recent Checks</h2>
//                 <button
//                   onClick={() => navigate(`/endpoints/${selectedEndpoint.endpointId}`)}
//                   className="text-sm text-blue-600 hover:text-blue-800"
//                 >
//                   View All
//                 </button>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Code</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {history.slice(0, 10).map((check) => (
//                       <tr key={check._id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
//                             check.status === 'success' ? 'bg-green-100 text-green-800' :
//                             check.status === 'failure' ? 'bg-red-100 text-red-800' :
//                             'bg-orange-100 text-orange-800'
//                           }`}>
//                             {check.status}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
//                           {format(new Date(check.checkedAt), 'HH:mm:ss')}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {check.responseTime}ms
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
//                           {check.statusCode || '-'}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
//                           {check.errorMessage || '-'}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         ) : (
//           // No endpoint selected
//           <div className="h-full flex items-center justify-center">
//             <div className="text-center">
//               <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No Monitor Selected</h3>
//               <p className="text-gray-600 mb-6">Select a monitor from the sidebar or create a new one</p>
//               <button
//                 onClick={() => navigate('/endpoints/create')}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
//               >
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add New Monitor
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Delete Confirmation Modal */}
//       <ConfirmationModal
//         isOpen={deleteModal.isOpen}
//         onClose={() => setDeleteModal({ isOpen: false, endpointId: null })}
//         onConfirm={handleDelete}
//         title="Delete Monitor"
//         message="Are you sure you want to delete this monitor? This action cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         type="danger"
//       />
//     </div>
//   );
// };

// export default UptimeKumaDashboard;


















// src/pages/user/Dashboard/UptimeKumaDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Power,
  Edit,
  Trash2,
  Activity,
  BarChart2,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  User,
  LogOut,
  Menu,
  Wifi,
  WifiOff,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { toggleEndpoint, deleteEndpoint } from '../../../api/userAction/userAction';
import { getEndpointStats, getEndpointHistory, triggerManualCheck } from '../../../api/userAction/userAction';
import { wsService, type EndpointStatus } from '../../../services/websocketService';
import type { HealthCheck, EndpointStats } from '../../../types/interface/healthCheckInterface';
import ResponseTimeChart from '../../../component/userComponent/ResponseTimeChart';
import HealthStatusBadge from '../../../component/userComponent/HealthStatusBadge';
import ConfirmationModal from '../../../component/common/ConfirmationModal';
import { formatDistanceToNow, format } from 'date-fns';

// Loading Spinner
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
    </div>
  );
};

// Stat Card for right panel
const StatCard: React.FC<{
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  trend?: number;
}> = ({ label, value, subValue, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
      </div>
    </div>
  );
};

// Monitor Item for sidebar
const MonitorItem: React.FC<{
  endpoint: EndpointStatus;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ endpoint, isSelected, onSelect, onToggle, onEdit, onDelete }) => {
  return (
    <div
      className={`group relative rounded-lg transition-all cursor-pointer ${
        isSelected 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'hover:bg-gray-50 border-transparent'
      } border`}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <HealthStatusBadge status={endpoint.status} size="sm" />
              <h3 className="font-medium text-gray-900 truncate">{endpoint.name}</h3>
            </div>
            <p className="text-xs text-gray-500 truncate mt-1">{endpoint.url}</p>
            <div className="flex items-center space-x-3 mt-2 text-xs">
              <span className="text-gray-600">{endpoint.lastResponseTime}ms</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{endpoint.uptime.toFixed(1)}%</span>
            </div>
          </div>
          
          {/* Action buttons - appear on hover */}
          <div className="hidden group-hover:flex items-center space-x-1 absolute right-2 top-2 bg-inherit">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`p-1 rounded hover:bg-gray-200 ${
                endpoint.status === 'down' ? 'text-green-600' : 'text-gray-600'
              }`}
              title={endpoint.status === 'down' ? 'Activate' : 'Deactivate'}
            >
              <Power className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 rounded hover:bg-gray-200 text-gray-600"
              title="Edit"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded hover:bg-gray-200 text-red-600"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Component for alerts
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Bell className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg ${bgColors[type]} animate-slideIn`}>
      <div className="flex items-center space-x-3">
        {icons[type]}
        <p className={`text-sm font-medium ${textColors[type]}`}>{message}</p>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const UptimeKumaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<EndpointStatus[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointStatus | null>(null);
  const [stats, setStats] = useState<EndpointStats | null>(null);
  const [history, setHistory] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; endpointId: string | null }>({
    isOpen: false,
    endpointId: null,
  });
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Use refs to avoid stale closures in event handlers
  const selectedEndpointRef = useRef(selectedEndpoint);
  const statusesRef = useRef(statuses);

  // Update refs when state changes
  useEffect(() => {
    selectedEndpointRef.current = selectedEndpoint;
  }, [selectedEndpoint]);

  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  // Add toast notification
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Connect to WebSocket on mount
  useEffect(() => {
    const token = localStorage.getItem('user');
    if (token) {
      wsService.connect()
        .then(() => {
          console.log('WebSocket connected successfully');
          // Request initial data after connection
          wsService.requestInitialData();
        })
        .catch((error) => {
          console.error('Failed to connect to WebSocket:', error);
          addToast('Failed to connect to real-time updates', 'error');
        });
    }

    // Set up WebSocket listeners
    wsService.on('connection-status', ({ connected }) => {
      setIsConnected(connected);
      if (connected) {
        addToast('Connected to real-time updates', 'success');
      } else {
        addToast('Disconnected from real-time updates', 'warning');
      }
    });

    wsService.on('initial-data', (data) => {
      console.log('Received initial data:', data);
      setStatuses(data.statuses);
      
      if (data.statuses.length > 0 && !selectedEndpointRef.current) {
        setSelectedEndpoint(data.statuses[0]);
        // Subscribe to the first endpoint
        wsService.subscribeToEndpoint(data.statuses[0].endpointId);
      }
      
      setLoading(false);
      setInitialDataLoaded(true);
    });

    wsService.on('endpoint-updated', ({ endpointId, check }) => {
      // Update statuses using functional update to avoid stale closure
      setStatuses(prev => prev.map(s => 
        s.endpointId === endpointId 
          ? { 
              ...s, 
              lastResponseTime: check.responseTime, 
              lastChecked: check.checkedAt,
              status: check.status === 'success' ? 'up' : 
                     check.status === 'timeout' ? 'degraded' : 'down'
            }
          : s
      ));

      // Check if this is the selected endpoint using ref
      if (selectedEndpointRef.current?.endpointId === endpointId) {
        const newCheck: HealthCheck = {
          _id: check.id,
          endpointId,
          userId: '',
          status: check.status,
          responseTime: check.responseTime,
          statusCode: check.statusCode,
          errorMessage: check.errorMessage,
          checkedAt: check.checkedAt,
          createdAt: check.checkedAt,
          updatedAt: check.checkedAt
        };
        setHistory(prev => [newCheck, ...prev.slice(0, 99)]);
      }

      // Show toast for status changes using ref
      const endpoint = statusesRef.current.find(s => s.endpointId === endpointId);
      if (endpoint) {
        const newStatus = check.status === 'success' ? 'up' : 
                         check.status === 'timeout' ? 'degraded' : 'down';
        if (endpoint.status !== newStatus) {
          addToast(
            `${endpoint.name} is now ${newStatus.toUpperCase()}`,
            newStatus === 'up' ? 'success' : 'warning'
          );
        }
      }
    });

    wsService.on('live-stats', ({ statuses: newStatuses }) => {
      setStatuses(newStatuses);
      
      // Update selected endpoint if it exists using ref
      if (selectedEndpointRef.current) {
        const updated = newStatuses.find(s => s.endpointId === selectedEndpointRef.current?.endpointId);
        if (updated) {
          setSelectedEndpoint(updated);
        }
      }
    });

    wsService.on('threshold-alert', (alert) => {
      addToast(alert.message, 'warning');
    });

    wsService.on('error', (error) => {
      console.error('WebSocket error:', error);
      addToast(error.message || 'WebSocket error occurred', 'error');
    });

    return () => {
      wsService.disconnect();
    };
  }, []); // Empty dependency array is now safe because we use refs

  // Handle subscription when selected endpoint changes
  useEffect(() => {
    if (selectedEndpoint && initialDataLoaded) {
      wsService.subscribeToEndpoint(selectedEndpoint.endpointId);
    }
  }, [selectedEndpoint, initialDataLoaded]);

  // Fetch detailed data when endpoint or time range changes
  useEffect(() => {
    if (selectedEndpoint && initialDataLoaded) {
      const fetchDetails = async () => {
        try {
          const hoursMap = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
          const [statsData, historyData] = await Promise.all([
            getEndpointStats(selectedEndpoint.endpointId, hoursMap[timeRange]),
            getEndpointHistory(selectedEndpoint.endpointId, 100)
          ]);
          setStats(statsData);
          setHistory(historyData);
        } catch (error) {
          console.error('Failed to fetch endpoint details:', error);
          addToast('Failed to load endpoint details', 'error');
        }
      };
      
      fetchDetails();
    }
  }, [selectedEndpoint, timeRange, initialDataLoaded]);

  // Handle endpoint selection
  const handleSelectEndpoint = (status: EndpointStatus) => {
    setSelectedEndpoint(status);
    // Subscribe to this endpoint for real-time updates
    wsService.subscribeToEndpoint(status.endpointId);
  };

  // Handle manual check
  const handleManualCheck = async () => {
    if (!selectedEndpoint) return;
    
    try {
      await triggerManualCheck(selectedEndpoint.endpointId);
      addToast('Manual check triggered', 'success');
      // Update will come via WebSocket
    } catch (error) {
      console.error('Failed to trigger manual check:', error);
      addToast('Failed to trigger manual check', 'error');
    }
  };

  // Handle toggle active
  const handleToggle = async (endpointId: string) => {
    try {
      await toggleEndpoint(endpointId);
      addToast('Endpoint status toggled', 'success');
      // Update will come via WebSocket
    } catch (error) {
      console.error('Failed to toggle endpoint:', error);
      addToast('Failed to toggle endpoint', 'error');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.endpointId) return;
    
    try {
      await deleteEndpoint(deleteModal.endpointId);
      setDeleteModal({ isOpen: false, endpointId: null });
      addToast('Endpoint deleted successfully', 'success');
      
      // Clear selected if it was deleted
      if (selectedEndpoint?.endpointId === deleteModal.endpointId) {
        setSelectedEndpoint(null);
      }
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
      addToast('Failed to delete endpoint', 'error');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    wsService.disconnect();
    navigate('/login');
  };

  // Filter endpoints based on search
  const filteredStatuses = statuses.filter(status => 
    status.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    status.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className={`font-bold text-xl text-gray-900 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
                API Monitor
              </h1>
              {/* Connection Status Indicator */}
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {!sidebarCollapsed && (
            <div className="mt-4 space-y-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search monitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* Add New Button */}
              <button
                onClick={() => navigate('/endpoints/create')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Monitor
              </button>
            </div>
          )}
        </div>

        {/* Monitors List */}
        <div className="flex-1 overflow-y-auto p-3">
          {sidebarCollapsed ? (
            // Collapsed view - show only icons
            <div className="space-y-3">
              {filteredStatuses.map((status) => (
                <div
                  key={status.endpointId}
                  onClick={() => handleSelectEndpoint(status)}
                  className={`relative p-2 rounded-lg cursor-pointer ${
                    selectedEndpoint?.endpointId === status.endpointId
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  title={status.name}
                >
                  <div className="flex justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      status.status === 'up' ? 'bg-green-500' :
                      status.status === 'degraded' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Expanded view - show full items
            <div className="space-y-2">
              {filteredStatuses.map((status) => (
                <MonitorItem
                  key={status.endpointId}
                  endpoint={status}
                  isSelected={selectedEndpoint?.endpointId === status.endpointId}
                  onSelect={() => handleSelectEndpoint(status)}
                  onToggle={() => handleToggle(status.endpointId)}
                  onEdit={() => navigate(`/endpoints/${status.endpointId}/edit`)}
                  onDelete={() => setDeleteModal({ isOpen: true, endpointId: status.endpointId })}
                />
              ))}
              
              {filteredStatuses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No monitors found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer - User Info */}
        <div className="p-4 border-t border-gray-200">
          {sidebarCollapsed ? (
            <button className="w-full p-2 hover:bg-gray-100 rounded-lg">
              <User className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {localStorage.getItem('userName') || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">Free Plan</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Main Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedEndpoint && stats ? (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{selectedEndpoint.name}</h1>
                  <HealthStatusBadge status={selectedEndpoint.status} />
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">{selectedEndpoint.url}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    Last check: {formatDistanceToNow(new Date(selectedEndpoint.lastChecked), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleManualCheck}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Check Now
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <StatCard
                label="Uptime (24h)"
                value={`${stats.uptime.toFixed(2)}%`}
                icon={<Activity className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                label="Avg Response"
                value={`${Math.round(stats.avgResponseTime)}ms`}
                icon={<BarChart2 className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                label="Success"
                value={stats.successCount}
                subValue={`${((stats.successCount / stats.totalChecks) * 100).toFixed(1)}%`}
                icon={<CheckCircle className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                label="Failures"
                value={stats.failureCount}
                subValue={`${((stats.failureCount / stats.totalChecks) * 100).toFixed(1)}%`}
                icon={<XCircle className="w-5 h-5" />}
                color="red"
              />
              <StatCard
                label="Timeouts"
                value={stats.timeoutCount}
                subValue={`${((stats.timeoutCount / stats.totalChecks) * 100).toFixed(1)}%`}
                icon={<Clock className="w-5 h-5" />}
                color="orange"
              />
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Response Time History</h2>
                <div className="flex space-x-2">
                  {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        timeRange === range
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <ResponseTimeChart data={history} timeRange={timeRange} height={300} />
            </div>

            {/* Recent Checks Table */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Checks</h2>
                <button
                  onClick={() => navigate(`/endpoints/${selectedEndpoint.endpointId}`)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.slice(0, 10).map((check) => (
                      <tr key={check._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            check.status === 'success' ? 'bg-green-100 text-green-800' :
                            check.status === 'failure' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {check.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(check.checkedAt), 'HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {check.responseTime}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {check.statusCode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">
                          {check.errorMessage || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // No endpoint selected
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Monitor Selected</h3>
              <p className="text-gray-600 mb-6">Select a monitor from the sidebar or create a new one</p>
              <button
                onClick={() => navigate('/endpoints/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Monitor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
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
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../../redux/store";

export default function Home() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const isLoggedIn = !!user.name; 
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Hero Section */}
      <div className="border-b border-gray-700/50 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                API Health Monitor
              </h1>
            </div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {isLoggedIn 
                ? `Welcome back, ${user.name}!` 
                : "Monitor your APIs in real-time with comprehensive health checks"}
            </p>
            
            {/* CTA Buttons - Only show when user is NOT logged in */}
            {!isLoggedIn && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => navigate("/register")}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-900/30"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 border border-gray-700"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Dashboard Button - Show when user IS logged in */}
            {isLoggedIn && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-900/30"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section - Always visible */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Key Features</h2>
          <p className="text-gray-400">Everything you need to monitor your API health</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:border-green-500/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Monitoring</h3>
            <p className="text-gray-400 text-sm">
              Monitor your APIs in real-time with configurable check intervals (1, 5, or 15 minutes)
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:border-green-500/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Performance Metrics</h3>
            <p className="text-gray-400 text-sm">
              Track response times, success rates, and get alerted when thresholds are exceeded
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 hover:border-green-500/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Alerts</h3>
            <p className="text-gray-400 text-sm">
              Get notified when APIs go down or performance degrades beyond your thresholds
            </p>
          </div>
        </div>

        {/* Call to Action - Only show when user is NOT logged in */}
        {!isLoggedIn && (
          <div className="mt-16 bg-gray-800/40 border border-gray-700/50 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">Ready to start monitoring?</h3>
            <p className="text-gray-400 mb-6">
              Create an account to add your first API endpoint and start tracking its health
            </p>
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              Create Free Account
            </button>
          </div>
        )}

        {/* For logged-in users - Show quick stats or something? */}
        {isLoggedIn && (
          <div className="mt-16 bg-gray-800/40 border border-gray-700/50 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">Welcome back!</h3>
            <p className="text-gray-400 mb-6">
              Check your dashboard to see real-time status of your APIs
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
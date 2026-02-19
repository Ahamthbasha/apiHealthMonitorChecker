// components/Header.tsx
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { clearUserDetails } from "../../redux/slices/userSlice";
import { logout as logoutAPI } from "../../api/authAction/userAuth";
import { toast } from "react-toastify";
import { LayoutDashboard } from "lucide-react";
import type { RootState } from "../../redux/store";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.user);

  const isLoggedIn = !!user.userId;

  const handleLogout = async () => {
    try {
      await logoutAPI();
      dispatch(clearUserDetails());
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-gray-900 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              API Health
            </span>
          </button>

          {/* Nav */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Dashboard link */}
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-green-600/20 text-green-400 border border-green-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:block">Dashboard</span>
                </button>

                {/* Profile */}
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-white font-semibold text-xs">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-300 hidden sm:block">
                    {user.name?.split(" ")[0] || "User"}
                  </span>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearUserDetails } from "../../redux/slices/userSlice"; 
import { logout as logoutAPI } from "../../api/authAction/userAuth"; 
import { toast } from "react-toastify";
import type { RootState } from "../../redux/store";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignUp = () => {
    navigate("/register");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={handleLogoClick}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              API Health
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {/* Profile Button */}
                <button
                  onClick={handleProfile}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.name?.split(' ')[0] || "User"}
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Login
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={handleSignUp}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
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
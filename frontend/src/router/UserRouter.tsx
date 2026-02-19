import Home from "../pages/user/Home/Home";
import UserLayout from "../layout/userLayout/UserLayout";
import Login from "../pages/user/Auth/Login";
import Register from "../pages/user/Auth/Register";
import { Routes, Route } from "react-router-dom";
import UserSessionRoute from "../protecter/userProtecter/UserSessionRoute";
import OTPVerification from "../pages/user/Auth/OTPVerification";
import UserPrivateRoute from "../protecter/userProtecter/UserPrivateRoute";
// import Dashboard from "../pages/user/Dashboard/Dashboard";
import EndpointForm from "../pages/user/endpoint/EndpointForm";
import EndpointDetails from "../pages/user/endpoint/EndointDetails";
import EndpointHealthDashboard from "../pages/user/health/EndpointHealthDashboard";
import EndpointHealthHistory from "../pages/user/health/EndpointHealthHistory";
import UptimeKumaDashboard from "../pages/user/Dashboard/UptimeKumaDashboard";

const UserRouter = () => {
  return (
    <Routes>
      {/* user layout */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/register"
          element={
            <UserSessionRoute>
              <Register />
            </UserSessionRoute>
          }
        />
        <Route
          path="/login"
          element={
            <UserSessionRoute>
              <Login />
            </UserSessionRoute>
          }
        />
        <Route path="/verifyOtp" element={<OTPVerification />} />

        <Route path="/" element={<UserPrivateRoute/>}>
        <Route path="dashboard" element={<UptimeKumaDashboard/>}/>

        <Route path="health" element={<EndpointHealthDashboard/>}/>
        <Route path="health/:endpointId" element={<EndpointHealthHistory/>}/>
        <Route path="endpoints/create" element={<EndpointForm/>}/>
        <Route path="endpoints/:endpointId" element={<EndpointDetails/>}/>
        <Route path="endpoints/:endpointId/edit" element={<EndpointForm/>}/>
        </Route>
      </Route>
    </Routes>
  );
};

export default UserRouter;

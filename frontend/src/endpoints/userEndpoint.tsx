const userRouterEndPoints = {
  userRegister: "/api/user/register",
  userLogin: "/api/user/login",
  userLogout: "/api/user/logout",
  userProfile: "/api/user/profile",
  userVerifyOTP: "/api/user/verifyOtp",
  userResendOTP: "/api/user/resendOtp",

  endpoints: "/api/user/endpoints",
  getEndpoint: (endpointId: string) => `/api/user/endpoints/${endpointId}`,
  updateEndpoint: (endpointId: string) => `/api/user/endpoints/${endpointId}`,
  deleteEndpoint: (endpointId: string) => `/api/user/endpoints/${endpointId}`,
  toggleEndpoint: (endpointId: string) =>
    `/api/user/endpoints/${endpointId}/status`,

  healthStatus: "/api/user/status",
  getEndpointHistory: (endpointId: string, limit?: number) =>
    `/api/user/endpoints/${endpointId}/history${limit ? `?limit=${limit}` : ""}`,
  getEndpointStats: (endpointId: string, hours?: number) =>
    `/api/user/endpoints/${endpointId}/stats${hours ? `?hours=${hours}` : ""}`,
  triggerManualCheck: (endpointId: string) =>
    `/api/user/endpoints/${endpointId}/check`,
};

export default userRouterEndPoints;

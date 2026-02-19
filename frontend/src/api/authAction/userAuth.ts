import { API } from "../../services/axios"; 
import userRouterEndPoints from "../../endpoints/userEndpoint"; 
import type { LoginCredentials, RegisterCredentials } from '../../types/interface/userInterface'
export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UserSearchResponse {
  success: boolean;
  data: UserSearchResult[];
}

export interface VerifyOTPData{
  email : string;
  otp:string;
}
export const login = async (credentials: LoginCredentials) => {
  const response = await API.post(userRouterEndPoints.userLogin, credentials);
  return response.data;
};

export const registerUser = async (data: RegisterCredentials) => {
  const response = await API.post(userRouterEndPoints.userRegister, data);
  return response.data;
};

export const logout = async () => {
  const response = await API.post(userRouterEndPoints.userLogout, {});
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get(userRouterEndPoints.userProfile);
  return response.data; 
};

export const verifyOTP = async (data: VerifyOTPData) => {
  const response = await API.post(userRouterEndPoints.userVerifyOTP, data);
  return response.data;
};

export const resendOTP = async (data:{email: string}) => {
  const response = await API.post(userRouterEndPoints.userResendOTP, data);
  return response.data;
};

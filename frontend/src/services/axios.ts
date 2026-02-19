// src/service/axios.ts
import axios, {
  type AxiosInstance,
  type AxiosError,
} from "axios";
import { toast } from "react-toastify";
import { clearUserDetails } from "../redux/slices/userSlice"; 
import { type Dispatch, type AnyAction } from "@reduxjs/toolkit";
import { type NavigateFunction } from "react-router-dom";

export const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Automatically sends cookies with every request
  timeout: 10000,
});

export const configureAxiosInterceptors = (
  dispatch: Dispatch<AnyAction>,
  navigate: NavigateFunction
) => {
  // No request interceptor needed - cookies are sent automatically via withCredentials

  // Response interceptor: handle errors
  API.interceptors.response.use(
    (response) => response, // Pass through successful responses

    (error: AxiosError) => {
      // 401 means authentication failed (both tokens invalid/expired)
      if (error.response?.status === 401) {
        dispatch(clearUserDetails());
        toast.error("Session expired. Please login again.");
        navigate("/login");
      }

      // Server error feedback
      if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      }

      return Promise.reject(error);
    }
  );
};
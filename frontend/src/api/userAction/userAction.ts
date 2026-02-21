
import { API } from "../../services/axios";
import userRouterEndPoints from "../../endpoints/userEndpoint";
import type {
  ApiEndpoint,
  CreateEndpointDTO,
  UpdateEndpointDTO,
  ApiResponse,
} from "../../types/interface/apiInterface";
import type { EndpointStats, EndpointStatus, HealthCheck, HealthCheckDTO, PaginatedResponse } from "../../types/interface/healthCheckInterface";

export const getUserEndpoints = async (): Promise<ApiEndpoint[]> => {
  const response = await API.get<ApiResponse<ApiEndpoint[]>>(
    userRouterEndPoints.endpoints,
  );
  return response.data.data;
};

export const getEndpointById = async (
  endpointId: string,
): Promise<ApiEndpoint> => {
  const response = await API.get<ApiResponse<ApiEndpoint>>(
    userRouterEndPoints.getEndpoint(endpointId),
  );
  return response.data.data;
};

export const createEndpoint = async (
  data: CreateEndpointDTO,
): Promise<ApiEndpoint> => {
  const response = await API.post<ApiResponse<ApiEndpoint>>(
    userRouterEndPoints.endpoints,
    data,
  );
  return response.data.data;
};

export const updateEndpoint = async (
  endpointId: string,
  data: UpdateEndpointDTO,
): Promise<ApiEndpoint> => {
  const response = await API.put<ApiResponse<ApiEndpoint>>(
    userRouterEndPoints.updateEndpoint(endpointId),
    data,
  );
  return response.data.data;
};

export const deleteEndpoint = async (endpointId: string): Promise<void> => {
  await API.delete(userRouterEndPoints.deleteEndpoint(endpointId));
};

export const toggleEndpoint = async (
  endpointId: string,
): Promise<ApiEndpoint> => {
  const response = await API.patch<ApiResponse<ApiEndpoint>>(
    userRouterEndPoints.toggleEndpoint(endpointId),
  );
  return response.data.data;
};

export const getUserEndpointsStatus = async (): Promise<EndpointStatus[]> => {
  const response = await API.get<ApiResponse<EndpointStatus[]>>(
    userRouterEndPoints.healthStatus
  );
  return response.data.data;
};

export const getEndpointHistory = async (
  endpointId: string,
  limit: number = 100
): Promise<HealthCheckDTO[]> => {
  const response = await API.get<ApiResponse<HealthCheckDTO[]>>(
    userRouterEndPoints.getEndpointHistory(endpointId, limit)
  );
  return response.data.data;
};

export const getEndpointStats = async (
  endpointId: string,
  hours: number = 24
): Promise<EndpointStats> => {
  const response = await API.get<ApiResponse<EndpointStats>>(
    userRouterEndPoints.getEndpointStats(endpointId, hours)
  );
  return response.data.data;
};

export const triggerManualCheck = async (
  endpointId: string
): Promise<HealthCheck> => {
  const response = await API.post<ApiResponse<HealthCheck>>(
    userRouterEndPoints.triggerManualCheck(endpointId)
  );
  return response.data.data;
};

export const getRecentHealthChecks = async (
  endpointId: string,
  limit: number = 10
): Promise<HealthCheckDTO[]> => {
  try {

    const response = await API.get(
      userRouterEndPoints.getRecentHealthChecks(endpointId, limit),
    );

    return response.data.data;
  } catch (error) {
    console.error("Error fetching recent health checks:", error);
    throw error;
  }
};
export const getAllHealthChecks = async (
  endpointId: string,
  page: number = 1,
  limit: number = 20,
  status: string = 'all'
): Promise<PaginatedResponse<HealthCheckDTO>> => {
  try {
    let url = `${userRouterEndPoints.getAllHealthChecks(endpointId)}?page=${page}&limit=${limit}`;
   
    if (status !== 'all') {
      url += `&status=${status}`;
    }

    const response = await API.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching all health checks:", error);
    throw error;
  }
};
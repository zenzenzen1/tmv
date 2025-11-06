import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { BaseResponse, ErrorResponse } from "../types/api";
import { useAuthStore } from "../stores/authStore";

// Extend AxiosRequestConfig to include metadata
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
}

// API base configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Enable cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    // Add request timestamp
    config.metadata = { startTime: new Date() };

    // JWT token is handled via HttpOnly cookies from backend
    // No need to manually add Authorization header

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse<BaseResponse>) => {
    // Calculate request duration
    const customConfig = response.config as CustomAxiosRequestConfig;
    const duration = customConfig.metadata?.startTime
      ? new Date().getTime() - customConfig.metadata.startTime.getTime()
      : 0;

    // Log response in development
    if (import.meta.env.DEV) {
      //   console.log(
      //     `✅ API Response: ${response.config.method?.toUpperCase()} ${
      //       response.config.url
      //     }`,
      //     {
      //       status: response.status,
      //       duration: `${duration}ms`,
      //       data: response.data,
      //     }
      //   );
    }

    // Handle API-level errors (only if response has success field)
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      !response.data.success
    ) {
      const error: ErrorResponse = {
        success: false,
        message: (response.data as any).message || "An error occurred",
        error: "API_ERROR",
        timestamp: new Date().toISOString(),
        path: response.config.url,
      };
      return Promise.reject(error);
    }

    return response;
  },
  (error: AxiosError) => {
    // Calculate request duration
    const customConfig = error.config as CustomAxiosRequestConfig;
    const duration = customConfig?.metadata?.startTime
      ? new Date().getTime() - customConfig.metadata.startTime.getTime()
      : 0;

    // Log error in development (skip 400/404 for submissions endpoints - expected behavior)
    const isSubmissionsEndpoint = error.config?.url?.includes("/submissions");
    const isExpectedError =
      isSubmissionsEndpoint &&
      (error.response?.status === 400 || error.response?.status === 404);

    if (import.meta.env.DEV && !isExpectedError) {
      console.error(
        `❌ API Error: ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
        {
          status: error.response?.status,
          duration: `${duration}ms`,
          error: error.message,
          data: error.response?.data,
        }
      );
    }

    // Handle different error types
    let errorResponse: ErrorResponse;

    if (error.response) {
      // Server responded with error status
      const responseData = error.response.data as any;
      errorResponse = {
        success: false,
        message:
          responseData?.message || `Server error: ${error.response.status}`,
        error: responseData?.error || "SERVER_ERROR",
        timestamp: new Date().toISOString(),
        path: error.config?.url,
      };
    } else if (error.request) {
      // Request was made but no response received
      errorResponse = {
        success: false,
        message: "Network error: No response from server",
        error: "NETWORK_ERROR",
        timestamp: new Date().toISOString(),
        path: error.config?.url,
      };
    } else {
      // Something else happened
      errorResponse = {
        success: false,
        message: error.message || "An unexpected error occurred",
        error: "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
        path: error.config?.url,
      };
    }

    // Handle specific status codes for authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Unauthorized/Forbidden - token expired or invalid
      console.warn("🔒 Authentication failed - redirecting to login");

      // Clear auth state
      const { logout } = useAuthStore.getState();
      logout();

      // Redirect to login page
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(errorResponse);
  }
);

export default apiClient;

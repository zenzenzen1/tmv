import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { BaseResponse, ErrorResponse } from "../types/api";
import { API_ENDPOINTS } from "../config/endpoints";
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
    // Handle API-level errors (only if response has success field)
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      !response.data.success
    ) {
      const body = response.data as BaseResponse<unknown>;
      const error: ErrorResponse = {
        success: false,
        message: body.message || "An error occurred",
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
    const startTime = customConfig?.metadata?.startTime;

    // Log error in development (skip 400/404 for submissions endpoints - expected behavior)
    const isSubmissionsEndpoint = error.config?.url?.includes("/submissions");
    const isExpectedError =
      isSubmissionsEndpoint &&
      (error.response?.status === 400 || error.response?.status === 404);

    if (import.meta.env.DEV && !isExpectedError) {
      const duration = startTime ? Date.now() - startTime.getTime() : 0;
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
    type ErrorPayload = Partial<ErrorResponse> & Record<string, unknown>;

    if (error.response) {
      // Server responded with error status
      const responseData = (error.response.data ?? {}) as ErrorPayload;
      errorResponse = {
        success: false,
        message:
          responseData?.message || `Server error: ${error.response.status}`,
        error:
          typeof responseData?.error === "string"
            ? responseData.error
            : "SERVER_ERROR",
        timestamp: new Date().toISOString(),
        path: error.config?.url,
      };
      // Special-case: invalid credentials on login
      const isLoginEndpoint = (error.config?.url || "").includes(
        API_ENDPOINTS?.AUTH?.LOGIN || "/v1/auth/login"
      );
      if (isLoginEndpoint && error.response.status === 401) {
        if (responseData?.error === "ACCOUNT_INACTIVE") {
          errorResponse.message =
            responseData?.message || "Account is inactive";
          errorResponse.error = "ACCOUNT_INACTIVE";
        } else {
          errorResponse.message = "Invalid email or password";
          errorResponse.error = "AUTH_ERROR";
        }
      }
      if (isLoginEndpoint && error.response.status === 404) {
        errorResponse.message = "User not found";
        errorResponse.error = "NOT_FOUND_ERROR";
      }
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
    const isLoginEndpoint = (error.config?.url || "").includes(
      API_ENDPOINTS?.AUTH?.LOGIN || "/v1/auth/login"
    );
    const url = error.config?.url || "";
    const shouldBypassAuthRedirect =
      url.includes(API_ENDPOINTS?.AUTH?.ME || "/v1/auth/me") ||
      url.includes("/application-forms/public") ||
      url.includes("/tournament-forms/public") ||
      (url.includes("/tournament-forms/") && url.includes("/submissions"));

    const isGuest = !useAuthStore.getState().isAuthenticated;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !isLoginEndpoint
    ) {
      if (isGuest || shouldBypassAuthRedirect) {
        return Promise.reject(errorResponse);
      }

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

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/v1/auth/login",
    ME: "/v1/auth/me",
    REGISTER: "/v1/auth/register",
    REFRESH: "/v1/auth/refresh",
    LOGOUT: "/v1/auth/logout",
    FORGOT_PASSWORD: "/v1/auth/forgot-password",
    RESET_PASSWORD: "/v1/auth/reset-password",
    VERIFY_EMAIL: "/v1/auth/verify-email",
  },

  // User management
  USERS: {
    BASE: "/users",
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    UPLOAD_AVATAR: "/users/avatar",
  },

  // File management
  FILES: {
    BASE: "/files",
    UPLOAD: "/files/upload",
    DOWNLOAD: "/files/download",
    DELETE: "/files",
  },

  // Common endpoints
  HEALTH: "/health",
  VERSION: "/version",
} as const;

// Helper function to build endpoint URLs
export const buildEndpoint = (base: string, ...paths: string[]): string => {
  return [base, ...paths].join("/").replace(/\/+/g, "/");
};

// Type-safe endpoint builder
export type EndpointKey = keyof typeof API_ENDPOINTS;
export type EndpointPath<T extends EndpointKey> = (typeof API_ENDPOINTS)[T];

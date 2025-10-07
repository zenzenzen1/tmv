<<<<<<< fvc-frontend/src/config/endpoints.ts
// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
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

  // Weight classes
  WEIGHT_CLASSES: {
    BASE: "/weight-classes",
    BY_ID: (id: string) => `/weight-classes/${id}`,
    STATUS: (id: string) => `/weight-classes/${id}/status`,
  },

  // Tournament forms
  TOURNAMENT_FORMS: {
    BASE: "/tournament-forms",
    BY_ID: (id: string) => `/tournament-forms/${id}`,
    STATUS: (id: string) => `/tournament-forms/${id}/status`,
    SUBMISSIONS: (id: string) => `/tournament-forms/${id}/submissions`,
    SUBMISSION_STATUS: (submissionId: string) =>
      `/tournament-forms/submissions/${submissionId}/status`,
    COMPETITIONS: "/tournament-forms/competitions",
  },

  // Fist contents
  FIST_CONTENTS: {
    BASE: "/fist-configs",
    BY_ID: (id: string) => `/fist-configs/${id}`,
    ITEMS: "/fist-configs/items",
    ITEM_BY_ID: (id: string) => `/fist-configs/items/${id}`,
    ITEMS_BY_CONFIG: (configId: string) => `/fist-configs/${configId}/items`,
  },

  // Music contents
  MUSIC_CONTENTS: {
    BASE: "/music-contents",
    BY_ID: (id: string) => `/music-contents/${id}`,
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


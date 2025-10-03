// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
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

  // Weight classes
  WEIGHT_CLASSES: {
    BASE: "/weight-classes",
    BY_ID: (id: string) => `/weight-classes/${id}`,
    STATUS: (id: string) => `/weight-classes/${id}/status`,
  },

  // Tournament forms
  TOURNAMENT_FORMS: {
    BASE: "/tournament-forms",

  // Fist contents
  FIST_CONTENTS: {
    BASE: '/fist-configs',
    BY_ID: (id: string) => `/fist-configs/${id}`,
  },

  // Music contents
  MUSIC_CONTENTS: {
    BASE: '/music-contents',
    BY_ID: (id: string) => `/music-contents/${id}`,
  },
} as const;

// Helper function to build endpoint URLs
export const buildEndpoint = (base: string, ...paths: string[]): string => {
  return [base, ...paths].join("/").replace(/\/+/g, "/");
};

// Type-safe endpoint builder
export type EndpointKey = keyof typeof API_ENDPOINTS;
export type EndpointPath<T extends EndpointKey> = (typeof API_ENDPOINTS)[T];

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
    BASE: "/v1/users",
    PROFILE: "/v1/users/profile",
    UPDATE_PROFILE: "/v1/users/profile",
    CHANGE_PASSWORD: "/v1/users/change-password",
    UPLOAD_AVATAR: "/v1/users/avatar",
  },

  // File management
  FILES: {
    BASE: "/v1/files",
    UPLOAD: "/v1/files/upload",
    DOWNLOAD: "/v1/files/download",
    DELETE: "/v1/files",
  },

  // Weight classes
  WEIGHT_CLASSES: {
    BASE: "/v1/weight-classes",
    BY_ID: (id: string) => `/v1/weight-classes/${id}`,
    STATUS: (id: string) => `/v1/weight-classes/${id}/status`,
  },

  // Submitted Application Forms
  SUBMITTED_FORMS: {
    BASE: "/v1/submitted-forms",
    BY_ID: (id: string) => `/v1/submitted-forms/${id}`,
    EXPORT: (id: string) => `/v1/submitted-forms/${id}/export`,
  },

  // Application Form Configs
  APPLICATION_FORMS: {
    BASE: "/v1/application-forms",
    BY_ID: (id: string) => `/v1/application-forms/${id}`,
    BY_TYPE: (type: string) => `/v1/application-forms/${type}`,
    INIT_CLUB: "/v1/application-forms/init-club-registration",
  },

  // Tournament forms
  TOURNAMENT_FORMS: {
    BASE: "/v1/tournament-forms",
    BY_ID: (id: string) => `/v1/tournament-forms/${id}`,
    STATUS: (id: string) => `/v1/tournament-forms/${id}/status`,
    SUBMISSIONS: (id: string) => `/v1/tournament-forms/${id}/submissions`,
    SUBMISSION_STATUS: (submissionId: string) =>
      `/v1/tournament-forms/submissions/${submissionId}/status`,
    COMPETITIONS: "/v1/tournament-forms/competitions",
  },

  // Competitions
  COMPETITIONS: {
    BASE: "/v1/competitions",
    BY_ID: (id: string) => `/v1/competitions/${id}`,
  },

  // Fist contents
  FIST_CONTENTS: {
    BASE: "/v1/fist-configs",
    BY_ID: (id: string) => `/v1/fist-configs/${id}`,
    ITEMS: "/v1/fist-configs/items",
    ITEM_BY_ID: (id: string) => `/v1/fist-configs/items/${id}`,
    ITEMS_BY_CONFIG: (configId: string) => `/v1/fist-configs/${configId}/items`,
    TYPES: {
      BASE: "/v1/fist-types",
      BY_ID: (id: string) => `/v1/fist-types/${id}`,
    },
  },

  // Music contents
  MUSIC_CONTENTS: {
    BASE: "/v1/music-contents",
    BY_ID: (id: string) => `/v1/music-contents/${id}`,
  },

  // Athletes
  ATHLETES: {
    BASE: "/v1/athletes",
    ARRANGE_ORDER: "/v1/athletes/arrange-order",
  },

  // Club Members
  CLUB_MEMBERS: {
    BASE: "/v1/clubs/members",
    BY_ID: (id: string) => `/v1/clubs/members/${id}`,
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

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/v1/auth/login",
    REGISTER: "/v1/auth/register",
    ME: "/v1/auth/me",
    REFRESH: "/v1/auth/refresh",
    LOGOUT: "/v1/auth/logout",
    FORGOT_PASSWORD: "/v1/auth/forgot-password",
    RESET_PASSWORD: "/v1/auth/reset-password",
    VERIFY_EMAIL: "/v1/auth/verify-email",
  },

  // Profile management
  PROFILE: {
    GET: "/v1/profile",
    UPDATE: "/v1/profile",
    CHANGE_PASSWORD: "/v1/profile/change-password",
  },
  // User management
  USERS: {
    BASE: "/v1/users",
    CREATE: "/v1/users/create",
    SEARCH: "/v1/users/search",
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

  // Fields
  FIELDS: {
    BASE: "/v1/fields",
    BY_ID: (id: string) => `/v1/fields/${id}`,
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
    POSTPONE_CLUB: "/v1/application-forms/club-registration/postpone",
  },

  // Waitlist
  WAITLIST: {
    ADD: "/v1/waitlist/add",
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
    SEED_NUMBERS: "/v1/athletes/seed-numbers",
    STATUS: "/v1/athletes/status",
  },

  // Performance matches (quyền/võ nhạc)
  PERFORMANCE_MATCHES: {
    SAVE_BY_PERFORMANCE: (performanceId: string) =>
      `/v1/performance-matches/performance/${performanceId}/save`,
    BY_PERFORMANCE: (performanceId: string) =>
      `/v1/performance-matches/performance/${performanceId}`,
    BY_COMPETITION: (competitionId: string) =>
      `/v1/performance-matches/competition/${competitionId}`,
    ASSESSORS: (performanceMatchId: string) =>
      `/v1/performance-matches/${performanceMatchId}/assessors`,
  },

  // Club Members
  CLUB_MEMBERS: {
    BASE: "/v1/clubs/members",
    BY_ID: (id: string) => `/v1/clubs/members/${id}`,
  },

  // Draw management
  DRAWS: {
    PERFORM: "/v1/draws/perform",
    HISTORY: "/v1/draws/history/{competitionId}/{weightClassId}",
    FINAL: "/v1/draws/final/{competitionId}/{weightClassId}",
    FINALIZE: "/v1/draws/finalize/{drawSessionId}",
  },

  // Match/Scoring management
  MATCHES: {
    LIST: "/v1/matches/list",
    CREATE: "/v1/matches/create",
    BULK_CREATE: "/v1/matches/bulk-create",
    SCOREBOARD: "/v1/matches/{matchId}/scoreboard",
    EVENTS: "/v1/matches/{matchId}/events",
    SCORE: "/v1/matches/score",
    CONTROL: "/v1/matches/control",
    UNDO: "/v1/matches/{matchId}/undo",
    UPDATE_ROUND_DURATION: "/v1/matches/{matchId}/round-duration",
    UPDATE_MAIN_ROUND_DURATION: "/v1/matches/{matchId}/main-round-duration",
    UPDATE_TIEBREAKER_DURATION: "/v1/matches/{matchId}/tiebreaker-duration",
    UPDATE_FIELD: "/v1/matches/{matchId}/field",
    UPDATE_TOTAL_ROUNDS: "/v1/matches/{matchId}/total-rounds",
    UPDATE_SCHEDULED_START_TIME: "/v1/matches/{matchId}/scheduled-start-time",
    UPDATE_ATHLETE_PRESENCE: "/v1/matches/{matchId}/athlete-presence",
  },

  // Match Assessors
  MATCH_ASSESSORS: {
    BASE: "/v1/match-assessors",
    AVAILABLE: "/v1/match-assessors/available",
    ASSIGN: "/v1/match-assessors/assign",
    ASSIGN_BY_PERFORMANCE: "/v1/match-assessors/assign/performance",
    ASSIGN_SINGLE: "/v1/match-assessors/assign/single",
    LIST: "/v1/match-assessors/match/{matchId}",
    BY_ID: (id: string) => `/v1/match-assessors/${id}`,
    MY_ASSIGNMENTS: "/v1/match-assessors/my-assigned-matches",
    BY_COMPETITION: (competitionId: string) =>
      `/v1/match-assessors/competition/${competitionId}`,
    BY_COMPETITION_AND_SPECIALIZATION: (
      competitionId: string,
      specialization: string
    ) =>
      `/v1/match-assessors/competition/${competitionId}/specialization/${specialization}`,
  },

  // Scoring (Performance projection)
  SCORING: {
    PERFORMANCE_BY_ID: "/v1/scoring/performance/{performanceId}",
    SUBMIT: "/v1/scoring/submit",
  },

  // Performances (fallback/basic info)
  PERFORMANCES: {
    CREATE: "/v1/performances",
    BY_ID: "/v1/performances/{id}",
    BY_MATCH_ID: "/v1/performances/by-match/{matchId}",
    START: (id: string) => `/v1/performances/${id}/start`,
    COMPLETE: (id: string) => `/v1/performances/${id}/complete`,
  },

  // Common endpoints
  HEALTH: "/health",
  VERSION: "/version",

  // Epic B: Training Sessions
  TRAINING_SESSIONS: {
    BASE: "/v1/training-sessions",
    BY_ID: (id: string) => `/v1/training-sessions/${id}`,
    STATUS: (id: string) => `/v1/training-sessions/${id}/status`,
    CALENDAR: "/v1/training-sessions/calendar",
  },

  // Epic B: Locations
  LOCATIONS: {
    BASE: "/v1/locations",
    BY_ID: (id: string) => `/v1/locations/${id}`,
    DEACTIVATE: (id: string) => `/v1/locations/${id}/deactivate`,
  },

  // Epic B: Session Attendance
  ATTENDANCE: {
    BY_SESSION: (sessionId: string) =>
      `/v1/training-sessions/${sessionId}/attendance`,
    BY_ATTENDANCE_ID: (sessionId: string, id: string) =>
      `/v1/training-sessions/${sessionId}/attendance/${id}`,
    BULK: (sessionId: string) =>
      `/v1/training-sessions/${sessionId}/attendance/bulk`,
    STATISTICS: (sessionId: string) =>
      `/v1/training-sessions/${sessionId}/attendance/statistics`,
  },
} as const;

// Helper function to build endpoint URLs
export const buildEndpoint = (base: string, ...paths: string[]): string => {
  return [base, ...paths].join("/").replace(/\/+/g, "/");
};

// Type-safe endpoint builder
export type EndpointKey = keyof typeof API_ENDPOINTS;
export type EndpointPath<T extends EndpointKey> = (typeof API_ENDPOINTS)[T];

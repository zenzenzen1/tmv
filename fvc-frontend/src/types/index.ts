// ==========================
// ✅ Re-export all types from ./api
// ==========================
export * from "./api";

// ==========================
// ✅ Common entity types
// ==========================
export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
  MODERATOR: "MODERATOR",
  MEMBER: "MEMBER",
  TEACHER: "TEACHER",
  EXECUTIVE_BOARD: "EXECUTIVE_BOARD",
  ORGANIZATION_COMMITTEE: "ORGANIZATION_COMMITTEE",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  personalMail?: string;
  eduMail?: string;
  studentCode?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================
// ✅ Auth types
// ==========================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
  message?: string;
}

// ==========================
// ✅ Generic UI types
// ==========================

// FVC API specific types for register
export interface FvcRegisterRequest {
  fullName: string;
  personalMail: string;
  eduMail?: string;
  password: string;
  studentCode?: string;
}

export interface FvcUserResponse {
  id: string;
  fullName: string;
  personalMail: string;
  eduMail?: string | null;
  studentCode?: string | null;
  systemRole: string;
}

// Generic types
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface FilterOption {
  field: string;
  operator: "eq" | "ne" | "gt" | "lt" | "like" | "in" | "between";
  value: any;
}

// ==========================
// ✅ Weight Class domain
// ==========================
export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const WeightClassStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
} as const;
export type WeightClassStatus =
  (typeof WeightClassStatus)[keyof typeof WeightClassStatus];

export interface WeightClassResponse {
  id: string;
  gender: Gender;
  minWeight: number;
  maxWeight: number;
  note?: string | null;
  status: WeightClassStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeightClassRequest {
  gender: Gender;
  minWeight: number;
  maxWeight: number;
  note?: string;
  saveMode?: WeightClassStatus;
}

export interface UpdateWeightClassRequest {
  minWeight?: number;
  maxWeight?: number;
  note?: string;
}

export interface WeightClassFilters {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  gender?: Gender;
  status?: WeightClassStatus;
}

// ==========================
// ✅ Fist Content domain
// ==========================
export interface FistContentResponse {
  id: string;
  name: string;
  description?: string | null;
  status?: boolean;
  typeId?: string;
  typeName?: string;
}

export interface CreateFistContentRequest {
  name: string;
  description?: string;
  status?: boolean;
  typeId?: string;
}

export interface UpdateFistContentRequest {
  name?: string;
  description?: string;
  status?: boolean;
  typeId?: string;
}

export interface FistContentFilters {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: boolean;
  typeId?: string;
}

// Fist Type domain (dynamic)
export interface FistTypeResponse {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface CreateFistTypeRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateFistTypeRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ==========================
// ✅ Music Content domain
// ==========================
export interface MusicContentResponse {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface MusicContentCreateRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface MusicContentUpdateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface MusicContentFilters {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | string;
}

// ==========================
// ✅ Tournament / Competition domain
// ==========================
export const TournamentStatus = {
  DRAFT: "DRAFT",
  OPEN_REGISTRATION: "OPEN_REGISTRATION",
  IN_PROGRESS: "IN_PROGRESS",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
} as const;
export type TournamentStatus =
  (typeof TournamentStatus)[keyof typeof TournamentStatus];

export interface FistConfigResponse {
  id: string;
  name: string;
  description?: string;
}

export interface FistItemResponse {
  id: string;
  name: string;
  description?: string;
  level?: number;
  parentId?: string;
  configId?: string;
  configName?: string;
}

export interface CreateFistItemRequest {
  name: string;
  description?: string;
}

export interface UpdateFistItemRequest {
  name?: string;
  description?: string;
}

export interface CompetitionResponse {
  id: string;
  name: string;
  description?: string;
  registrationStartDate: string;
  registrationEndDate: string;
  weighInDate: string;
  startDate: string;
  endDate: string;
  openingCeremonyTime?: string;
  drawDate?: string;
  location?: string;
  status: TournamentStatus;
  numberOfParticipants?: number;

  weightClasses: WeightClassResponse[];
  vovinamFistConfigs: FistConfigResponse[];
  musicPerformances: MusicContentResponse[];

  fistConfigItemSelections: Record<string, FistItemResponse[]>;

  numberOfRounds?: number;
  roundDurationSeconds?: number;
  allowExtraRound?: boolean;
  maxExtraRounds?: number;
  tieBreakRule?: string;
  assessorCount?: number;
  injuryTimeoutSeconds?: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateCompetitionRequest {
  name: string;
  description?: string;
  registrationStartDate: string;
  registrationEndDate: string;
  weighInDate: string;
  startDate: string;
  endDate: string;
  openingCeremonyTime?: string;
  drawDate?: string;
  location?: string;
  vovinamFistConfigIds: string[];
  musicPerformanceIds: string[];
  weightClassIds: string[];
  fistConfigItemSelections: Record<string, string[]>;
  numberOfRounds?: number;
  roundDurationSeconds?: number;
  allowExtraRound?: boolean;
  maxExtraRounds?: number;
  tieBreakRule?: string;
  assessorCount?: number;
  injuryTimeoutSeconds?: number;
}

export interface UpdateCompetitionRequest
  extends Partial<CreateCompetitionRequest> {}

export interface CompetitionFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
  status?: TournamentStatus;
  year?: string;
  location?: string;
}

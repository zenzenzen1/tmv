// Re-export all types
export * from './api';

// Common entity types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MODERATOR: 'MODERATOR'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Common form types
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
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'like' | 'in' | 'between';
  value: any;
}

// WeightClass domain
export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

export const WeightClassStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
} as const;
export type WeightClassStatus = typeof WeightClassStatus[keyof typeof WeightClassStatus];

export interface WeightClassResponse {
  [key: string]: unknown;
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
  saveMode?: WeightClassStatus; // DRAFT or ACTIVE
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

// Fist Content domain
export interface FistContentResponse {
  id: string;
  name: string;
  description?: string | null;
  status: boolean;
}

export interface CreateFistContentRequest {
  name: string;
  description?: string;
  status?: boolean;
}

export interface UpdateFistContentRequest {
  name?: string;
  description?: string;
  status?: boolean;
}

export interface FistContentFilters {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: boolean;
}

// Music content domain
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
  status?: 'ACTIVE' | 'INACTIVE' | string;
}

// Tournament/Competition domain
export const TournamentStatus = {
  DRAFT: 'DRAFT',
  OPEN_REGISTRATION: 'OPEN_REGISTRATION',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
} as const;
export type TournamentStatus = typeof TournamentStatus[keyof typeof TournamentStatus];

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
  
  // Related content
  weightClasses: WeightClassResponse[];
  vovinamFistConfigs: FistConfigResponse[];
  musicPerformances: MusicContentResponse[];
  
  // Fist content with selected items
  fistConfigItemSelections: Record<string, FistItemResponse[]>;
  
  // Sparring configuration
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
  
  // Content selections
  vovinamFistConfigIds: string[];
  musicPerformanceIds: string[];
  weightClassIds: string[];
  
  // Fist content selection - config ID mapped to selected item IDs
  fistConfigItemSelections: Record<string, string[]>;
  
  // Sparring configuration
  numberOfRounds?: number;
  roundDurationSeconds?: number;
  allowExtraRound?: boolean;
  maxExtraRounds?: number;
  tieBreakRule?: string;
  assessorCount?: number;
  injuryTimeoutSeconds?: number;
}

export interface UpdateCompetitionRequest {
  name?: string;
  description?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  weighInDate?: string;
  startDate?: string;
  endDate?: string;
  openingCeremonyTime?: string;
  drawDate?: string;
  location?: string;
  
  // Content selections
  vovinamFistConfigIds?: string[];
  musicPerformanceIds?: string[];
  weightClassIds?: string[];
  
  // Fist content selection - config ID mapped to selected item IDs
  fistConfigItemSelections?: Record<string, string[]>;
  
  // Sparring configuration
  numberOfRounds?: number;
  roundDurationSeconds?: number;
  allowExtraRound?: boolean;
  maxExtraRounds?: number;
  tieBreakRule?: string;
  assessorCount?: number;
  injuryTimeoutSeconds?: number;
}

export interface CompetitionFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  status?: TournamentStatus;
  year?: string;
  location?: string;
}
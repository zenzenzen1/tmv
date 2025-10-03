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
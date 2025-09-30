// Re-export all types
export * from "./api";

// Common entity types
export interface User {
  id: string;
  fullName: string;
  personalMail: string;
  eduMail: string;
  studentCode: string;
  systemRole: UserRole;
}

export const UserRole = {
  MEMBER: "MEMBER",
  TEACHER: "TEACHER",
  EXECUTIVE_BOARD: "EXECUTIVE_BOARD",
  ORGANIZATION_COMMITTEE: "ORGANIZATION_COMMITTEE",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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
  message: string;
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

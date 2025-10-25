// User types for frontend
export type SystemRole = "MEMBER" | "TEACHER" | "EXECUTIVE_BOARD" | "ORGANIZATION_COMMITTEE" | "ADMIN";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface CreateUserRequest {
  fullName: string;
  personalMail: string;
  password: string;
  eduMail?: string;
  studentCode?: string;
  dob?: string; // ISO date format: YYYY-MM-DD
  gender?: Gender;
  systemRole: SystemRole | null;
}

export interface UserResponse {
  id: string;
  fullName: string;
  personalMail: string;
  eduMail?: string;
  studentCode?: string;
  dob?: string;
  gender?: string;
  systemRole: SystemRole;
  status?: boolean;
  createdAt?: string;
  [key: string]: any; // Add index signature for CommonTable
}

export interface UpdateUserRequest {
  fullName?: string;
  eduMail?: string;
  studentCode?: string;
  dob?: string;
  gender?: Gender;
  systemRole?: SystemRole;
  status?: boolean;
}

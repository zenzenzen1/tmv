import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { LoginRequest } from "../types";
import type { BaseResponse } from "../types/api";

class AuthService {
  /**
   * Login user with email and password
   * @param credentials - Login credentials
   * @returns Promise<AuthResponse>
   */
  async login(credentials: LoginRequest): Promise<any> {
    const response = await apiService.post<any>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    // apiService returns BaseResponse<T>; we need the actual data payload
    return (response as BaseResponse<any>).data;
  }

  /**
   * Logout user (clear cookies on server side)
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  /**
   * Get current user profile
   * @returns Promise<User>
   */
  async getCurrentUser(): Promise<any> {
    const response = await apiService.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;

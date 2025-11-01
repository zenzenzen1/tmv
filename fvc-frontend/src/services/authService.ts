import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { LoginRequest, FvcRegisterRequest, FvcRegisterResponse } from "../types";
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
    
    const data = (response as BaseResponse<any>).data;
    
    // JWT token is automatically stored in HttpOnly cookie by backend
    // No need to manually store it
    
    return data;
  }

  /**
   * Logout user (clear cookies on server side)
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    // JWT cookie is automatically cleared by backend
  }

  /**
   * Register new user
   * @param userData - Registration data
   * @returns Promise<FvcRegisterResponse>
   */
  async register(userData: FvcRegisterRequest): Promise<FvcRegisterResponse> {
    const response = await apiService.post<FvcRegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );
    
    const data = (response as BaseResponse<FvcRegisterResponse>).data;
    return data;
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

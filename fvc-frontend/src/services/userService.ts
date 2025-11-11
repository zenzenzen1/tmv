import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { CreateUserRequest, UserResponse } from "../types/user";
import type { BaseResponse, PaginationResponse } from "../types/api";

class UserService {
  /**
   * Create a new user
   * @param data - User creation data
   * @returns Promise<UserResponse>
   */
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const response = await apiService.post<BaseResponse<UserResponse>>(
      API_ENDPOINTS.USERS.CREATE,
      data
    );
    return (response as any).data;
  }

  /**
   * Get list of users (with pagination)
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @returns Promise<PaginationResponse<UserResponse>>
   */
  async getUsers(page: number = 0, size: number = 10): Promise<PaginationResponse<UserResponse>> {
    const response = await apiService.get<BaseResponse<PaginationResponse<UserResponse>>>(
      `${API_ENDPOINTS.USERS.BASE}?page=${page}&size=${size}`
    );
    return (response as any).data;
  }

  /**
   * Search users with filters
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @param query - Search query (fullName, email, studentCode)
   * @param role - System role filter
   * @param status - Status filter (true/false)
   * @returns Promise<PaginationResponse<UserResponse>>
   */
  async searchUsers(
    page: number = 0, 
    size: number = 10, 
    query?: string, 
    role?: string, 
    status?: boolean
  ): Promise<PaginationResponse<UserResponse>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (query) params.append("query", query);
    if (role) params.append("role", role);
    if (status !== undefined) params.append("status", status.toString());
    
    const response = await apiService.get<BaseResponse<PaginationResponse<UserResponse>>>(
      `${API_ENDPOINTS.USERS.BASE}/search?${params.toString()}`
    );
    return (response as any).data;
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @returns Promise<UserResponse>
   */
  async getUserById(id: string): Promise<UserResponse> {
    const response = await apiService.get<BaseResponse<UserResponse>>(
      `${API_ENDPOINTS.USERS.BASE}/${id}`
    );
    return (response as any).data;
  }

  /**
   * Search challenge users (isInChallenge = true and has clubMember)
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @param query - Search query (fullName, email, studentCode)
   * @returns Promise<PaginationResponse<UserResponse>>
   */
  async searchChallengeUsers(
    page: number = 0, 
    size: number = 10, 
    query?: string
  ): Promise<PaginationResponse<UserResponse>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (query) params.append("query", query);
    
    const response = await apiService.get<BaseResponse<PaginationResponse<UserResponse>>>(
      `${API_ENDPOINTS.USERS.BASE}/challenge/search?${params.toString()}`
    );
    return (response as any).data;
  }

  /**
   * Delete user
   * @param id - User ID
   * @returns Promise<void>
   */
  async deleteUser(id: string): Promise<void> {
    await apiService.delete(`${API_ENDPOINTS.USERS.BASE}/${id}`);
  }
}

// Create and export singleton instance
const userService = new UserService();
export default userService;

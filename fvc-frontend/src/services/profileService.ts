import apiService from "./api";
import { API_ENDPOINTS } from "../config/endpoints";
import type { ProfileResponse, UpdateProfileRequest, ChangePasswordRequest } from "../types";
import type { BaseResponse } from "../types/api";

class ProfileService {
  /**
   * Get current user profile
   * @returns Promise<ProfileResponse>
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiService.get<ProfileResponse>(
      API_ENDPOINTS.PROFILE.GET
    );
    return response.data!;
  }

  /**
   * Update user profile
   * @param data - Update profile data
   * @returns Promise<ProfileResponse>
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    const response = await apiService.put<ProfileResponse>(
      API_ENDPOINTS.PROFILE.UPDATE,
      data
    );
    return response.data!;
  }

  /**
   * Change user password
   * @param data - Change password data
   * @returns Promise<void>
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiService.post(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, data);
  }
}

// Create and export singleton instance
const profileService = new ProfileService();
export default profileService;

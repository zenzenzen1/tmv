package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.ChangePasswordRequest;
import sep490g65.fvcapi.dto.request.UpdateProfileRequest;
import sep490g65.fvcapi.dto.response.ProfileResponse;

public interface UserService {
    // Profile management
    ProfileResponse getCurrentUserProfile(String email);
    ProfileResponse updateProfile(String email, UpdateProfileRequest request);
    void changePassword(String email, ChangePasswordRequest request);
}


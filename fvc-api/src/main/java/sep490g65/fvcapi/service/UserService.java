package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.ChangePasswordRequest;
import sep490g65.fvcapi.dto.request.UpdateProfileRequest;
import sep490g65.fvcapi.dto.response.ProfileResponse;import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.request.CreateUserRequest;
import sep490g65.fvcapi.dto.response.UserResponse;

public interface UserService {
    // Profile management
    ProfileResponse getCurrentUserProfile(String email);
    ProfileResponse updateProfile(String email, UpdateProfileRequest request);
    void changePassword(String email, ChangePasswordRequest request);
    UserResponse createUser(CreateUserRequest request);
    Page<UserResponse> getAllUsers(Pageable pageable);
    Page<UserResponse> searchUsers(Pageable pageable, String query, String role, Boolean status);
    void deleteUser(String userId);
}

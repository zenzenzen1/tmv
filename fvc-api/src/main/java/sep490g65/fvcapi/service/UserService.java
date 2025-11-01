package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.request.CreateUserRequest;
import sep490g65.fvcapi.dto.response.UserResponse;

public interface UserService {
    UserResponse createUser(CreateUserRequest request);
    Page<UserResponse> getAllUsers(Pageable pageable);
    Page<UserResponse> searchUsers(Pageable pageable, String query, String role, Boolean status);
    void deleteUser(String userId);
}

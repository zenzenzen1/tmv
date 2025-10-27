package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.request.ChangePasswordRequest;
import sep490g65.fvcapi.dto.request.UpdateProfileRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.ProfileResponse;
import sep490g65.fvcapi.service.ProfileService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/profile")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<BaseResponse<ProfileResponse>> getProfile() {
        try {
            String email = getCurrentUserEmail();
            log.info("Fetching profile for email: {}", email);
            
            ProfileResponse profile = profileService.getCurrentUserProfile(email);
            return ResponseEntity.ok(ResponseUtils.success("Profile retrieved successfully", profile));
        } catch (Exception e) {
            log.error("Error fetching profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to retrieve profile", "INTERNAL_ERROR"));
        }
    }

    @PutMapping
    public ResponseEntity<BaseResponse<ProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        try {
            String email = getCurrentUserEmail();
            log.info("Updating profile for email: {}", email);
            
            ProfileResponse profile = profileService.updateProfile(email, request);
            return ResponseEntity.ok(ResponseUtils.success("Profile updated successfully", profile));
        } catch (RuntimeException e) {
            log.error("Error updating profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), "VALIDATION_ERROR"));
        } catch (Exception e) {
            log.error("Error updating profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to update profile", "INTERNAL_ERROR"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<BaseResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            String email = getCurrentUserEmail();
            log.info("Changing password for email: {}", email);
            
            profileService.changePassword(email, request);
            return ResponseEntity.ok(ResponseUtils.success("Password changed successfully"));
        } catch (RuntimeException e) {
            log.error("Error changing password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), "VALIDATION_ERROR"));
        } catch (Exception e) {
            log.error("Error changing password: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to change password", "INTERNAL_ERROR"));
        }
    }

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }
        
        String email = authentication.getName();
        log.debug("Current authenticated user: {}", email);
        return email;
    }
}

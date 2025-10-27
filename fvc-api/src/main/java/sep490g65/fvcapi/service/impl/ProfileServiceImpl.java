package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.ChangePasswordRequest;
import sep490g65.fvcapi.dto.request.UpdateProfileRequest;
import sep490g65.fvcapi.dto.response.ProfileResponse;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.exception.custom.ValidationException;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.ProfileService;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ProfileResponse getCurrentUserProfile(String email) {
        log.info("Fetching profile for email: {}", email);
        
        User user = userRepository.findByPersonalMailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        return mapToProfileResponse(user);
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        log.info("Updating profile for email: {}", email);
        
        User user = userRepository.findByPersonalMailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Update fullName
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        
        // Update personalMail with validation
        if (request.getPersonalMail() != null && !request.getPersonalMail().trim().isEmpty()) {
            String newPersonalMail = request.getPersonalMail().trim();
            // Check if email already exists for another user
            userRepository.findByPersonalMailIgnoreCase(newPersonalMail)
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(user.getId())) {
                            throw new ValidationException("personalMail", "Personal email already exists");
                        }
                    });
            user.setPersonalMail(newPersonalMail);
        }
        
        // Update eduMail with validation
        if (request.getEduMail() != null && !request.getEduMail().trim().isEmpty()) {
            String newEduMail = request.getEduMail().trim();
            // Check if email already exists for another user
            userRepository.findByEduMailIgnoreCase(newEduMail)
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(user.getId())) {
                            throw new ValidationException("eduMail", "Educational email already exists");
                        }
                    });
            user.setEduMail(newEduMail);
        }
        
        // Update studentCode with validation
        if (request.getStudentCode() != null && !request.getStudentCode().trim().isEmpty()) {
            String newStudentCode = request.getStudentCode().trim();
            // Check if student code already exists for another user
            userRepository.findByStudentCode(newStudentCode)
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(user.getId())) {
                            throw new ValidationException("studentCode", "Student code already exists");
                        }
                    });
            user.setStudentCode(newStudentCode);
        }
        
        // Update gender
        if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
            user.setGender(request.getGender().trim());
        }
        
        // Update dob
        if (request.getDob() != null) {
            user.setDob(request.getDob());
        }
        
        User updatedUser = userRepository.save(user);
        log.info("Profile updated successfully for user ID: {}", user.getId());
        
        return mapToProfileResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Changing password for email: {}", email);
        
        User user = userRepository.findByPersonalMailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getHashPassword())) {
            throw new ValidationException("currentPassword", "Current password is incorrect");
        }
        
        // Check if new password and confirm password match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("confirmPassword", "New password and confirm password do not match");
        }
        
        // Check if new password is different from current password
        if (passwordEncoder.matches(request.getNewPassword(), user.getHashPassword())) {
            throw new ValidationException("newPassword", "New password must be different from current password");
        }
        
        // Hash and set new password
        String hashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setHashPassword(hashedPassword);
        
        userRepository.save(user);
        log.info("Password changed successfully for user ID: {}", user.getId());
    }

    private ProfileResponse mapToProfileResponse(User user) {
        return ProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .eduMail(user.getEduMail())
                .studentCode(user.getStudentCode())
                .gender(user.getGender())
                .dob(user.getDob())
                .systemRole(user.getSystemRole())
                .status(user.getStatus())
                .isInChallenge(user.getIsInChallenge())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}

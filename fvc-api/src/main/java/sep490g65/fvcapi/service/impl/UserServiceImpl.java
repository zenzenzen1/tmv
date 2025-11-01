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
import sep490g65.fvcapi.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.request.CreateUserRequest;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.exception.BusinessException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    
    @Override
    public ProfileResponse getCurrentUserProfile(String email) {
        log.info("Fetching profile for email: {}", email);
        
        List<User> users = userRepository.findAllByPersonalMailIgnoreCase(email);
        if (users.isEmpty()) {
            throw new ResourceNotFoundException("User not found");
        }
        User user = users.get(0); // Get first user if duplicates exist
        
        return mapToProfileResponse(user);
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        log.info("Updating profile for email: {}", email);
        
        Optional<User> users = userRepository.findByPersonalMail(email);
        if (users.isEmpty()) {
            throw new ResourceNotFoundException("User not found");
        }
        User user = users.get(); 
        
        // Update fullName
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        
        // Update personalMail with validation
        if (request.getPersonalMail() != null && !request.getPersonalMail().trim().isEmpty()) {
            String newPersonalMail = request.getPersonalMail().trim();
            // Check if email already exists for another user
            List<User> existingUsers = userRepository.findAllByPersonalMailIgnoreCase(newPersonalMail);
            if (!existingUsers.isEmpty() && !existingUsers.get(0).getId().equals(user.getId())) {
                throw new ValidationException("personalMail", "Personal email already exists");
            }
            user.setPersonalMail(newPersonalMail);
        }
        
        // Update eduMail with validation
        if (request.getEduMail() != null && !request.getEduMail().trim().isEmpty()) {
            String newEduMail = request.getEduMail().trim();
            // Check if email already exists for another user
            List<User> existingUsers = userRepository.findAllByEduMailIgnoreCase(newEduMail);
            if (!existingUsers.isEmpty() && !existingUsers.get(0).getId().equals(user.getId())) {
                throw new ValidationException("eduMail", "Educational email already exists");
            }
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
        if (request.getDob() != null && !request.getDob().trim().isEmpty()) {
            try {
                LocalDate dob = LocalDate.parse(request.getDob().trim());
                user.setDob(dob);
            } catch (Exception e) {
                log.warn("Invalid date format for dob: {}", request.getDob());
                throw new ValidationException("dob", "Invalid date format. Please use YYYY-MM-DD format");
            }
        }
        
        User updatedUser = userRepository.save(user);
        log.info("Profile updated successfully for user ID: {}", user.getId());
        
        return mapToProfileResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Changing password for email: {}", email);
        
        List<User> users = userRepository.findAllByPersonalMailIgnoreCase(email);
        if (users.isEmpty()) {
            throw new ResourceNotFoundException("User not found");
        }
        User user = users.get(0); // Get first user if duplicates exist
        
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

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Attempting to create new user with email: {}", request.getPersonalMail());

        try {
            // Trim and validate inputs
            String personalMail = request.getPersonalMail().trim().toLowerCase();
            String eduMail = request.getEduMail() != null ? request.getEduMail().trim().toLowerCase() : null;

            // Check if personal email already exists
            if (userRepository.existsByPersonalMail(personalMail)) {
                log.warn("User creation failed: Personal email already exists - {}", personalMail);
                throw new BusinessException("Personal email already exists", "EMAIL_EXISTS");
            }

            // Check if edu email already exists (if provided)
            if (eduMail != null && !eduMail.isEmpty() && userRepository.existsByEduMail(eduMail)) {
                log.warn("User creation failed: Education email already exists - {}", eduMail);
                throw new BusinessException("Education email already exists", "EDU_EMAIL_EXISTS");
            }


            // Create new user
            User newUser = new User();
            newUser.setFullName(request.getFullName());
            newUser.setPersonalMail(personalMail);
            newUser.setEduMail(eduMail);
            newUser.setDob(request.getDob());
            newUser.setGender(request.getGender());
            newUser.setSystemRole(request.getSystemRole());
            newUser.setStatus(true); // Active by default
            newUser.setIsInChallenge(false);

            // Hash password
            String hashedPassword = passwordEncoder.encode(request.getPassword());
            newUser.setHashPassword(hashedPassword);

            // Save user to database
            User savedUser = userRepository.save(newUser);
            log.info("User created successfully with id: {}", savedUser.getId());

            return UserResponse.from(savedUser);

        } catch (BusinessException e) {
            log.error("Business error during user creation: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during user creation: {}", e.getMessage(), e);
            throw new BusinessException("Failed to create user", "USER_CREATION_FAILED");
        }
    }

    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        log.info("Fetching all users with page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        try {
            Page<User> userPage = userRepository.findAll(pageable);
            return userPage.map(UserResponse::from);
        } catch (Exception e) {
            log.error("Error fetching users: {}", e.getMessage(), e);
            throw new BusinessException("Failed to fetch users", "USER_FETCH_FAILED");
        }
    }

    @Override
    public Page<UserResponse> searchUsers(Pageable pageable, String query, String role, Boolean status) {
        log.info("Searching users - query: {}, role: {}, status: {}", query, role, status);
        
        try {
            Page<User> userPage = userRepository.findAll(pageable);
            
            // Filter by search query (fullName, personalMail only)
            if (query != null && !query.trim().isEmpty()) {
                String searchTerm = query.trim().toLowerCase();
                
                // Filter by fullName or personalMail only
                java.util.List<User> filteredList = userPage.getContent().stream()
                        .filter(user -> user.getFullName().toLowerCase().contains(searchTerm) ||
                                       user.getPersonalMail().toLowerCase().contains(searchTerm))
                        .collect(java.util.stream.Collectors.toList());
                
                userPage = new org.springframework.data.domain.PageImpl<>(
                    filteredList, pageable, filteredList.size()
                );
            }
            
            // Filter by role
            if (role != null && !role.trim().isEmpty()) {
                java.util.List<User> filteredList = userPage.getContent().stream()
                        .filter(user -> user.getSystemRole().name().equals(role.toUpperCase()))
                        .collect(java.util.stream.Collectors.toList());
                
                userPage = new org.springframework.data.domain.PageImpl<>(
                    filteredList, pageable, filteredList.size()
                );
            }
            
            // Filter by status
            if (status != null) {
                java.util.List<User> filteredList = userPage.getContent().stream()
                        .filter(user -> user.getStatus() == status)
                        .collect(java.util.stream.Collectors.toList());
                
                userPage = new org.springframework.data.domain.PageImpl<>(
                    filteredList, pageable, filteredList.size()
                );
            }
            
            return userPage.map(UserResponse::from);
        } catch (Exception e) {
            log.error("Error searching users: {}", e.getMessage(), e);
            throw new BusinessException("Failed to search users", "USER_SEARCH_FAILED");
        }
    }
}

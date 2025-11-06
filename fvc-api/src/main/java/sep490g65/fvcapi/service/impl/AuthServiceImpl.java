package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.request.RegisterRequest;
import sep490g65.fvcapi.dto.response.LoginResponse;
import sep490g65.fvcapi.dto.response.RegisterResponse;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.AuthService;
import sep490g65.fvcapi.utils.JwtUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("=== LOGIN START ===");
        log.info("Attempting login for email: {}", request.getEmail());
        
        try {
            // Find user by personal email only - normalize email for consistency
            String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : request.getEmail();
            log.info("Step 1: Finding user by email: {} (normalized: {})", request.getEmail(), normalizedEmail);
            List<User> users = userRepository.findAllByPersonalMailIgnoreCase(normalizedEmail);
            
            if (users.isEmpty()) {
                log.error("User not found for email: {} (normalized: {})", request.getEmail(), normalizedEmail);
                throw new BadCredentialsException("Invalid email or password");
            }
            
            // If there are duplicates, log a warning and use the first one
            if (users.size() > 1) {
                log.warn("Multiple users found with email: {} (normalized: {}). Using the first one. Total found: {}", request.getEmail(), normalizedEmail, users.size());
            }
            
            User user = users.get(0);
            log.info("User found: {} (ID: {})", user.getPersonalMail(), user.getId());

            // Log hash visibility and compare with BCrypt
            log.info("Step 2: Comparing password for email={} (normalized: {}), hash_present={}", request.getEmail(), normalizedEmail, user.getHashPassword() != null);
            boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getHashPassword());
            log.info("Password match result: {}", passwordMatches);
            
            if (!passwordMatches) {
                log.error("Password mismatch for user: {}", request.getEmail());
                throw new BadCredentialsException("Invalid email or password");
            }

            log.info("Step 3: Password verified successfully");


            // Generate token for email (can be used for future JWT integration)
            jwtUtils.generateTokenFromEmail(user.getPersonalMail());

            log.info("Step 5: Building response");
            LoginResponse response = LoginResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .eduMail(user.getEduMail())
                .studentCode(user.getStudentCode())
                .gender(user.getGender())
                .dob(user.getDob())
                .systemRole(user.getSystemRole())
                .message("Login successful")
                .build();
            
            log.info("Step 6: Response built successfully");
            log.info("Response data - name: {}, gender: {}, dob: {}", 
                response.getFullName(), response.getGender(), response.getDob());
            log.info("=== LOGIN SUCCESS ===");
            
            return response;

        } catch (BadCredentialsException e) {
            log.error("=== LOGIN FAILED - BadCredentials ===");
            log.error("Login failed for email: {} - {}", request.getEmail(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("=== LOGIN FAILED - UNEXPECTED ERROR ===");
            log.error("Unexpected error during login for email: {}", request.getEmail(), e);
            log.error("Error type: {}, Message: {}", e.getClass().getName(), e.getMessage());
            throw new RuntimeException("Login failed", e);
        }
    }

    @Override
    public RegisterResponse register(RegisterRequest request) {
        log.info("Attempting registration for email: {}", request.getPersonalMail());
        
        try {
            // Check if user already exists
            if (userRepository.findByPersonalMailIgnoreCase(request.getPersonalMail().trim()).isPresent()) {
                throw new IllegalArgumentException("User with this email already exists");
            }
            
            // Check if student code already exists
            if (userRepository.findByStudentCode(request.getStudentCode().trim()).isPresent()) {
                throw new IllegalArgumentException("User with this student code already exists");
            }
            
            // Validate password confirmation
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("Password and confirm password do not match");
            }
            
            // Create new user
            User user = new User();
            user.setFullName(request.getFullName().trim());
            user.setPersonalMail(request.getPersonalMail().trim());
            user.setEduMail(request.getEduMail() != null ? request.getEduMail().trim() : null);
            user.setHashPassword(passwordEncoder.encode(request.getPassword()));
            user.setStudentCode(request.getStudentCode().trim());
            user.setDob(request.getDob());
            user.setGender(request.getGender().trim());
            user.setSystemRole(SystemRole.MEMBER); // Default role for new registrations
            user.setStatus(true); // Active by default
            user.setIsInChallenge(false); // Not in challenge by default
            
            // Save user
            User savedUser = userRepository.save(user);
            
            log.info("Registration successful for user: {}", request.getPersonalMail());
            
            return RegisterResponse.builder()
                .id(savedUser.getId())
                .fullName(savedUser.getFullName())
                .personalMail(savedUser.getPersonalMail())
                .eduMail(savedUser.getEduMail())
                .studentCode(savedUser.getStudentCode())
                .systemRole(savedUser.getSystemRole())
                .message("Registration successful")
                .build();
                
        } catch (IllegalArgumentException e) {
            log.error("Registration failed for email: {} - {}", request.getPersonalMail(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Registration failed for email: {} - {}", request.getPersonalMail(), e.getMessage());
            throw new RuntimeException("Registration failed", e);
        }
    }

}

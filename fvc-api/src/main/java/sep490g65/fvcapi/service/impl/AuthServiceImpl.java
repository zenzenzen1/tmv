package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("Attempting login for email: {}", request.getEmail());
        
        try {
            // Find user by personal email only
            User user = userRepository.findByPersonalMailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

            // Log hash visibility and compare with BCrypt
            log.info("[Auth] Comparing password for email={}, hash_present={}", request.getEmail().trim(), user.getHashPassword() != null);
            if (!passwordEncoder.matches(request.getPassword(), user.getHashPassword())) {
                throw new BadCredentialsException("Invalid email or password");
            }

            log.info("Login successful for user: {}", request.getEmail());

            // Generate token for email
            String token = jwtUtils.generateTokenFromEmail(user.getPersonalMail());

            return LoginResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .eduMail(user.getEduMail())
                .studentCode(user.getStudentCode())
                .systemRole(user.getSystemRole())
                .message("Login successful")
                .build();

        } catch (AuthenticationException e) {
            log.error("Login failed for email: {} - {}", request.getEmail(), e.getMessage());
            throw new BadCredentialsException("Invalid email or password");
        } catch (Exception e) {
            log.error("Unexpected error during login for email: {} - {}", request.getEmail(), e.getMessage(), e);
            throw new BadCredentialsException("Invalid email or password");
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

package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.response.LoginResponse;
import sep490g65.fvcapi.entity.User;
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

            // Generate token for email (can be used for future JWT integration)
            jwtUtils.generateTokenFromEmail(user.getPersonalMail());

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
        }
    }

}

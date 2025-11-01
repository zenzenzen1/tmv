package sep490g65.fvcapi.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.request.RegisterRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.LoginResponse;
import sep490g65.fvcapi.dto.response.RegisterResponse;
import sep490g65.fvcapi.service.AuthService;
import sep490g65.fvcapi.utils.JwtUtils;
import sep490g65.fvcapi.utils.ResponseUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.entity.User;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    
    @Value("${spring.security.jwt.expiration}")
    private int tokenValidityInMs;

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        
        try {
            log.info("Login attempt for email: {}", request.getEmail());
            
            LoginResponse loginResponse = authService.login(request);
            log.info("Login succeeded for: {}", request.getEmail());
            
            // Generate JWT token
            String token = jwtUtils.generateTokenFromEmail(request.getEmail());
            log.info("Token generated successfully");
            
            // Create HttpOnly cookie
            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false); // Set to true in production with HTTPS
            cookie.setPath("/");
            cookie.setMaxAge(tokenValidityInMs / 1000); // Convert milliseconds to seconds
            response.addCookie(cookie);
            
            log.info("Cookie set: path={}, maxAge={}", cookie.getPath(), cookie.getMaxAge());
            
            log.info("Login successful for user: {}", request.getEmail());
            
            return ResponseEntity.ok(ResponseUtils.success("Login successful", loginResponse));
        } catch (Exception e) {
            log.error("=== EXCEPTION IN LOGIN CONTROLLER ===");
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            log.error("Stack trace:", e);
            throw e; // Re-throw to let GlobalExceptionHandler handle it
        }
    }

    @PostMapping("/register")
    public ResponseEntity<BaseResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        
        try {
            log.info("Registration attempt for email: {}", request.getPersonalMail());
            
            RegisterResponse registerResponse = authService.register(request);
            
            log.info("Registration successful for user: {}", request.getPersonalMail());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success("Registration successful", registerResponse));
            
        } catch (IllegalArgumentException e) {
            log.error("Registration failed for email: {} - {}", request.getPersonalMail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), "REGISTRATION_FAILED"));
        } catch (Exception e) {
            log.error("Registration failed for email: {} - {}", request.getPersonalMail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Registration failed", "REGISTRATION_ERROR"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<Void>> logout(HttpServletResponse response) {
        // Clear JWT HttpOnly cookie
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true in production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(0); // expire immediately
        response.addCookie(cookie);

        log.info("User logged out, JWT cookie cleared");
        return ResponseEntity.ok(ResponseUtils.success("Logout successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<BaseResponse<LoginResponse>> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseUtils.error("Unauthorized", "UNAUTHORIZED"));
        }

        String email = authentication.getName();
        java.util.List<User> users = userRepository.findAllByPersonalMailIgnoreCase(email);
        
        if (users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseUtils.error("Unauthorized", "UNAUTHORIZED"));
        }
        
        User user = users.get(0); // Get first user if duplicates exist

        LoginResponse data = LoginResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .eduMail(user.getEduMail())
                .studentCode(user.getStudentCode())
                .gender(user.getGender())
                .dob(user.getDob())
                .systemRole(user.getSystemRole())
                .message("OK")
                .build();

        return ResponseEntity.ok(ResponseUtils.success("OK", data));
    }
    
    @GetMapping("/test-cookie")
    public ResponseEntity<BaseResponse<String>> testCookie(jakarta.servlet.http.HttpServletRequest request) {
        if (request.getCookies() != null) {
            String cookies = java.util.Arrays.stream(request.getCookies())
                    .map(c -> c.getName() + "=" + c.getValue())
                    .collect(java.util.stream.Collectors.joining(", "));
            log.info("Cookies received: {}", cookies);
            return ResponseEntity.ok(ResponseUtils.success("Cookies found: " + cookies));
        }
        log.warn("No cookies found in request");
        return ResponseEntity.ok(ResponseUtils.success("No cookies"));
    }

}

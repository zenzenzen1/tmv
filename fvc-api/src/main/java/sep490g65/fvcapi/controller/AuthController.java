package sep490g65.fvcapi.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.dto.request.CreateUserRequest;
import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.LoginResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.exception.BusinessException;
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
    private int tokenValidityInSeconds;

    @PostMapping("/login")
    public ResponseEntity<BaseResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        
        try {
            log.info("Login attempt for email: {}", request.getEmail());
            
            LoginResponse loginResponse = authService.login(request);
            
            // Generate JWT token
            String token = jwtUtils.generateTokenFromEmail(request.getEmail());
            
            // Create HttpOnly cookie
            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false); // Set to true in production with HTTPS
            cookie.setPath("/");
            cookie.setMaxAge(tokenValidityInSeconds); // in application.properties
            response.addCookie(cookie);
            
            log.info("Login successful for user: {}", request.getEmail());
            
            return ResponseEntity.ok(ResponseUtils.success("Login successful", loginResponse));
            
        } catch (Exception e) {
            log.error("Login failed for email: {} - {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseUtils.error("Invalid email or password", "AUTH_FAILED"));
        }
    }

    @PostMapping("/create-user")
    public ResponseEntity<BaseResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        
        try {
            log.info("User registration attempt for email: {}", request.getPersonalMail());
            
            UserResponse userResponse = authService.createUser(request);
            
            log.info("User registered successfully with id: {}", userResponse.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success("User created successfully", userResponse));
            
        } catch (BusinessException e) {
            log.error("Business error during user registration: {} - {}", request.getPersonalMail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), e.getErrorCode()));
        } catch (Exception e) {
            log.error("Unexpected error during user registration: {} - {}", request.getPersonalMail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to create user", "USER_CREATION_FAILED"));
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
        User user = userRepository.findByPersonalMailIgnoreCase(email)
                .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseUtils.error("Unauthorized", "UNAUTHORIZED"));
        }

        LoginResponse data = LoginResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .eduMail(user.getEduMail())
                .studentCode(user.getStudentCode())
                .systemRole(user.getSystemRole())
                .message("OK")
                .build();

        return ResponseEntity.ok(ResponseUtils.success("OK", data));
    }

    @GetMapping("/users")
    public ResponseEntity<BaseResponse<Page<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            log.info("Fetching users - page: {}, size: {}", page, size);
            
            Pageable pageable = PageRequest.of(page, size);
            Page<UserResponse> users = authService.getAllUsers(pageable);
            
            log.info("Successfully fetched {} users", users.getTotalElements());
            
            return ResponseEntity.ok(ResponseUtils.success("Users fetched successfully", users));
            
        } catch (BusinessException e) {
            log.error("Business error fetching users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), e.getErrorCode()));
        } catch (Exception e) {
            log.error("Unexpected error fetching users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to fetch users", "USER_FETCH_FAILED"));
        }
    }

    @GetMapping("/users/search")
    public ResponseEntity<BaseResponse<Page<UserResponse>>> searchUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean status) {
        
        try {
            log.info("Searching users - page: {}, size: {}, query: {}, role: {}, status: {}", 
                    page, size, query, role, status);
            
            Pageable pageable = PageRequest.of(page, size);
            Page<UserResponse> users = authService.searchUsers(pageable, query, role, status);
            
            log.info("Successfully found {} users", users.getTotalElements());
            
            return ResponseEntity.ok(ResponseUtils.success("Users search completed", users));
            
        } catch (BusinessException e) {
            log.error("Business error searching users: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), e.getErrorCode()));
        } catch (Exception e) {
            log.error("Unexpected error searching users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to search users", "USER_SEARCH_FAILED"));
        }
    }
}

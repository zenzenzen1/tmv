package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.dto.request.CreateUserRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.exception.BusinessException;
import sep490g65.fvcapi.service.UserService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    private final UserService userService;

    @PostMapping("/create")
    public ResponseEntity<BaseResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        
        try {
            log.info("User creation attempt for email: {}", request.getPersonalMail());
            
            UserResponse userResponse = userService.createUser(request);
            
            log.info("User created successfully with id: {}", userResponse.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success("User created successfully", userResponse));
            
        } catch (BusinessException e) {
            log.error("Business error during user creation: {} - {}", request.getPersonalMail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), e.getErrorCode()));
        } catch (Exception e) {
            log.error("Unexpected error during user creation: {} - {}", request.getPersonalMail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to create user", "USER_CREATION_FAILED"));
        }
    }

    @GetMapping
    public ResponseEntity<BaseResponse<Page<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            log.info("Fetching users - page: {}, size: {}", page, size);
            
            Pageable pageable = PageRequest.of(page, size);
            Page<UserResponse> users = userService.getAllUsers(pageable);
            
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

    @GetMapping("/search")
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
            Page<UserResponse> users = userService.searchUsers(pageable, query, role, status);
            
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

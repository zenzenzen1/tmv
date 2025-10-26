package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import sep490g65.fvcapi.dto.request.CreateUserRequest;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.exception.BusinessException;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.UserService;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

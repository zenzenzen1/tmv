# FVC API - Spring Boot Application

A robust Spring Boot REST API application built with modern Java practices and enterprise-grade architecture patterns. This project demonstrates best practices for building scalable, maintainable, and production-ready REST APIs.

## 🚀 Project Overview

This Spring Boot application showcases enterprise-level development patterns including:

- **Clean Architecture** with proper separation of concerns
- **Global Exception Handling** with sequential error reporting
- **Standardized API Responses** with consistent format
- **Input Validation** using Jakarta Bean Validation
- **Pagination Support** for large datasets
- **Security Integration** with Spring Security
- **Database Integration** with JPA and PostgreSQL
- **Constants Management** for maintainable code

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Response Format](#api-response-format)
- [Architecture Patterns](#architecture-patterns)
- [Best Practices Implemented](#best-practices-implemented)
- [Code Examples](#code-examples)
- [Configuration](#configuration)
- [Testing](#testing)
- [Contributing](#contributing)

## 🛠 Technology Stack

- **Java 21** - Latest LTS version with modern features
- **Spring Boot 3.5.6** - Latest stable version with Spring Framework 6
- **Spring Data JPA** - Data persistence layer with Hibernate
- **Spring Security** - Authentication and authorization framework
- **Spring Web** - REST API development with MVC pattern
- **PostgreSQL** - Primary relational database
- **Lombok** - Boilerplate code reduction and cleaner syntax
- **Maven** - Dependency management and build automation
- **Jakarta Validation** - Input validation and constraint checking

## 📁 Project Structure

```
src/main/java/sep490g65/fvcapi/
├── constants/                 # Application constants
│   ├── ApiConstants.java     # API-related constants (pagination, security, etc.)
│   └── MessageConstants.java # Success and error message constants
├── dto/                      # Data Transfer Objects
│   ├── request/              # Request DTOs
│   │   └── RequestParam.java # Pagination and filtering parameters
│   └── response/             # Response DTOs
│       ├── BaseResponse.java # Standardized response wrapper
│       └── PaginationResponse.java # Paginated response wrapper
├── enums/                    # Enumerations
│   └── ErrorCode.java        # Error code definitions with messages
├── exception/                # Exception handling
│   ├── custom/               # Custom exception classes
│   │   ├── BusinessException.java
│   │   ├── ResourceNotFoundException.java
│   │   └── ValidationException.java
│   └── GlobalExceptionHandler.java # Global exception handler
├── utils/                    # Utility classes
│   └── ResponseUtils.java    # Response utility methods
└── FvcApiApplication.java    # Main Spring Boot application class
```

## 🚀 Getting Started

### Prerequisites

- **Java 21** or higher
- **Maven 3.6+**
- **PostgreSQL 12+**
- **IDE** (IntelliJ IDEA, Eclipse, or VS Code)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fvc-api
   ```

2. **Configure Database**
   ```bash
   # Create PostgreSQL database
   createdb fvc_api_db
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE fvc_api_db;
   ```

3. **Update Configuration**
   ```properties
   # src/main/resources/application.properties
   spring.application.name=fvc-api
   
   # Database configuration
   spring.datasource.url=jdbc:postgresql://localhost:5432/fvc_api_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   spring.jpa.hibernate.ddl-auto=update
   spring.jpa.show-sql=true
   
   # Logging configuration
   logging.level.sep490g65.fvcapi=DEBUG
   logging.level.org.springframework.security=DEBUG
   ```

4. **Build and Run**
   ```bash
   # Build the project
   mvn clean install
   
   # Run the application
   mvn spring-boot:run
   
   # Or run the JAR file
   java -jar target/fvc-api-0.0.1-SNAPSHOT.jar
   ```

5. **Verify Installation**
   ```bash
   # Check if application is running
   curl http://localhost:8080/api/v1/health
   
   # Or open in browser
   http://localhost:8080/api/v1
   ```

## 📚 API Response Format

### Success Response Format

**For GET requests (with data):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00"
}
```

**For POST/PUT/DELETE requests (without data):**
```json
{
  "success": true,
  "message": "User created successfully",
  "timestamp": "2024-01-15T10:30:00"
}
```

### Error Response Format

**All error responses follow this format:**
```json
{
  "success": false,
  "message": "Resource not found",
  "errorCode": "RESOURCE_NOT_FOUND",
  "timestamp": "2024-01-15T10:30:00"
}
```

### Sequential Error Handling

The application implements **sequential error handling** for validation errors:

1. **First Error**: Returns the first validation error encountered
2. **Fix and Retry**: After fixing the first error, the next error is returned
3. **Continue**: Process continues until all validation passes

**Example Flow:**
```json
// Step 1: First validation error
{
  "success": false,
  "message": "Invalid email format",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00"
}

// Step 2: After fixing email, next error
{
  "success": false,
  "message": "Password must be at least 8 characters",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2024-01-15T10:30:00"
}
```

## 🏗 Architecture Patterns

### 1. Layered Architecture

The project follows a clean layered architecture:

```
┌─────────────────┐
│   Controller    │ ← HTTP requests/responses
├─────────────────┤
│    Service      │ ← Business logic
├─────────────────┤
│   Repository    │ ← Data access
├─────────────────┤
│    Entity       │ ← Database mapping
└─────────────────┘
```

### 2. DTO Pattern

**Data Transfer Objects** are used to:
- Decouple internal entities from API contracts
- Control data exposure and validation
- Provide clear API documentation
- Enable versioning and backward compatibility

### 3. Global Exception Handling

**Centralized exception management** with:
- Custom exception types for different scenarios
- Consistent error response format
- Proper HTTP status codes
- Sequential error reporting for validation

### 4. Response Wrapper Pattern

**Standardized API responses** with:
- Consistent success/error format
- Automatic timestamp inclusion
- Type-safe generic responses
- Easy client-side handling

## ✅ Best Practices Implemented

### 1. Constants Management

```java
// Centralized constants for maintainability
public final class ApiConstants {
    public static final String API_VERSION = "v1";
    public static final String API_BASE_PATH = "/api/" + API_VERSION;
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String JWT_SECRET_KEY = "mySecretKey";
    public static final int JWT_EXPIRATION_MS = 86400000; // 24 hours
}
```

### 2. Input Validation

```java
// Request validation with Jakarta Bean Validation
@Data
@Builder
public class RequestParam {
    @Min(value = 0, message = "Page number must be 0 or greater")
    @Builder.Default
    private Integer page = 0;
    
    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = ApiConstants.MAX_PAGE_SIZE)
    @Builder.Default
    private Integer size = ApiConstants.DEFAULT_PAGE_SIZE;
    
    // Helper methods for validation
    public boolean hasSearch() {
        return search != null && !search.trim().isEmpty();
    }
}
```

### 3. Pagination Support

```java
// Built-in pagination with Spring Data
public PaginationResponse<T> getUsers(RequestParam params) {
    Pageable pageable = PageRequest.of(
        params.getPage(), 
        params.getSize(),
        Sort.by(params.getSortDirection(), params.getSortBy())
    );
    Page<User> users = userRepository.findAll(pageable);
    return ResponseUtils.createPaginatedResponse(users);
}
```

### 4. Global Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<BaseResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(BaseResponse.error(ex.getMessage(), "RESOURCE_NOT_FOUND"));
    }
    
    // Sequential validation error handling
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BaseResponse<Void>> handleValidation(
            MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getAllErrors().stream()
                .map(error -> error.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(BaseResponse.error(errorMessage, "VALIDATION_ERROR"));
    }
}
```

### 5. Builder Pattern with Lombok

```java
// Clean object creation with Lombok
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;
    private LocalDateTime timestamp;
    
    // Static factory methods
    public static <T> BaseResponse<T> success(String message, T data) {
        return BaseResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
```

### 6. Utility Classes

```java
// Static utility methods for common operations
public final class ResponseUtils {
    public static <T> BaseResponse<T> success(String message, T data) {
        return BaseResponse.success(message, data);
    }
    
    public static <T> PaginationResponse<T> createPaginatedResponse(Page<T> page) {
        return PaginationResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
```

## 📝 Code Examples

### Creating a New Controller

```java
@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/users")
@Validated
@Slf4j
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<UserDto>>> getUsers(
            @Valid RequestParam params) {
        PaginationResponse<UserDto> users = userService.getUsers(params);
        return ResponseEntity.ok(ResponseUtils.success("Users retrieved successfully", users));
    }
    
    @PostMapping
    public ResponseEntity<BaseResponse<UserDto>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserDto user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success(MessageConstants.USER_CREATED_SUCCESS, user));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ResponseUtils.success("User retrieved successfully", user));
    }
}
```

### Creating a Service Layer

```java
@Service
@Transactional
@Slf4j
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserMapper userMapper;
    
    public UserDto createUser(CreateUserRequest request) {
        // Validate business rules
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(
                String.format(MessageConstants.USER_ALREADY_EXISTS, request.getEmail()),
                ErrorCode.USER_ALREADY_EXISTS.getCode()
            );
        }
        
        // Create and save user
        User user = userMapper.toEntity(request);
        User savedUser = userRepository.save(user);
        
        log.info("User created successfully with ID: {}", savedUser.getId());
        return userMapper.toDto(savedUser);
    }
    
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toDto(user);
    }
    
    public PaginationResponse<UserDto> getUsers(RequestParam params) {
        Pageable pageable = PageRequest.of(
            params.getPage(),
            params.getSize(),
            Sort.by(params.getSortDirection(), params.getSortBy())
        );
        
        Page<User> users = userRepository.findAll(pageable);
        Page<UserDto> userDtos = users.map(userMapper::toDto);
        
        return ResponseUtils.createPaginatedResponse(userDtos);
    }
}
```

### Creating a Repository

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.status = :status")
    Page<User> findByStatus(@Param("status") UserStatus status, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findUsersWithSearch(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR u.status = :status)")
    Page<User> findUsersWithFilters(
        @Param("search") String search, 
        @Param("status") UserStatus status, 
        Pageable pageable
    );
}
```

### Creating Custom Exceptions

```java
// Business logic exceptions
public class BusinessException extends RuntimeException {
    private final String errorCode;
    
    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}

// Resource not found exceptions
public class ResourceNotFoundException extends RuntimeException {
    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;
    
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }
}
```

### Creating Request/Response DTOs

```java
// Request DTO with validation
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
    
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    private String phone;
}

// Response DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

## ⚙️ Configuration

### Application Properties

```properties
# Application configuration
spring.application.name=fvc-api
server.port=8080

# Database configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/fvc_api_db
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:password}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Logging configuration
logging.level.sep490g65.fvcapi=DEBUG
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE

# Security configuration
spring.security.user.name=admin
spring.security.user.password=admin123
spring.security.user.roles=ADMIN
```

### Environment Variables

```bash
# Database configuration
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export DB_URL=jdbc:postgresql://localhost:5432/fvc_api_db

# JWT configuration
export JWT_SECRET=your_jwt_secret_key
export JWT_EXPIRATION=86400000

# Application configuration
export SERVER_PORT=8080
export LOGGING_LEVEL=DEBUG
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=UserServiceTest

# Run tests with coverage
mvn test jacoco:report

# Run integration tests
mvn test -Dtest=*IntegrationTest
```

### Test Structure

```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class UserServiceTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void shouldCreateUserSuccessfully() {
        // Given
        CreateUserRequest request = CreateUserRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .password("password123")
                .build();
        
        // When
        UserDto result = userService.createUser(request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("John Doe");
        assertThat(result.getEmail()).isEqualTo("john@example.com");
    }
    
    @Test
    void shouldThrowExceptionWhenUserAlreadyExists() {
        // Given
        User existingUser = User.builder()
                .name("Existing User")
                .email("existing@example.com")
                .password("password123")
                .build();
        userRepository.save(existingUser);
        
        CreateUserRequest request = CreateUserRequest.builder()
                .name("New User")
                .email("existing@example.com")
                .password("password123")
                .build();
        
        // When & Then
        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("User already exists");
    }
}
```

## 🔧 Development Guidelines

### 1. Naming Conventions

- **Classes**: PascalCase (e.g., `UserService`, `BaseResponse`)
- **Methods**: camelCase (e.g., `createUser`, `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_VERSION`, `DEFAULT_PAGE_SIZE`)
- **Packages**: lowercase (e.g., `sep490g65.fvcapi.service`)
- **Variables**: camelCase (e.g., `userName`, `isActive`)

### 2. Exception Handling

- Use specific exceptions for different error scenarios
- Always include meaningful error messages
- Use error codes for client-side error handling
- Log exceptions with appropriate levels
- Implement sequential error handling for validation

### 3. Validation

- Validate input at the controller level
- Use Jakarta Bean Validation annotations
- Provide clear validation error messages
- Validate business rules in the service layer
- Use helper methods for complex validation logic

### 4. Documentation

- Document all public APIs with JavaDoc
- Include parameter descriptions and return types
- Provide example requests/responses
- Keep documentation up-to-date with code changes
- Use meaningful commit messages

### 5. Code Organization

- Follow single responsibility principle
- Use dependency injection properly
- Keep methods small and focused
- Use constants for magic numbers and strings
- Implement proper logging throughout the application

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Commit Message Format

```
type(scope): description

Examples:
feat(user): add user registration endpoint
fix(auth): resolve token validation issue
docs(api): update API documentation
refactor(service): improve user service performance
test(user): add unit tests for user service
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki
- Review the code examples in this README

---

**Happy Coding! 🚀**

*This project demonstrates enterprise-level Spring Boot development practices and serves as a reference implementation for building robust REST APIs.*
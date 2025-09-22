# FVC API (Spring Boot)

Enterprise-grade REST API for the FVC Management System built with Java 21 and Spring Boot 3.x. The codebase emphasizes clean architecture, standardized responses, robust validation, and predictable error handling.

## Tech Stack
- Java 21, Spring Boot 3.x
- Spring Web, Spring Data JPA (Hibernate)
- PostgreSQL
- Lombok

## Project Structure (key packages)
```
src/main/java/sep490g65/fvcapi/
├─ constants/          # `ApiConstants`, `MessageConstants`
├─ dto/
│  ├─ request/         # `RequestParam` (paging/sort/filter)
│  └─ response/        # `BaseResponse`, `PaginationResponse`
├─ entity/             # `BaseEntity`, `User`, `Competition`...
├─ enums/              # `ErrorCode`, `SystemRole`, ...
├─ exception/          # Global + custom exceptions
├─ repository/         # Spring Data repositories
├─ service/            # Services and implementations
├─ utils/              # `ResponseUtils` helpers
└─ FvcApiApplication.java
```

## Run & Configure

### 1) Database config (application.yaml)
`src/main/resources/application.yaml` (already present) contains:
- PostgreSQL datasource (url, username, password)
- JPA settings (`ddl-auto`, `show-sql`, dialect)
- Flyway (optional), logging levels
- Security placeholders (JWT secret/expiration)
- CORS config (allowed origins/methods)

Adjust credentials, then run:
```bash
mvn spring-boot:run
# API base: http://localhost:8080/api
```

## Core Conventions

- Standard response envelope via `BaseResponse<T>` and `ResponseUtils`
- Global error handling in `GlobalExceptionHandler`
- Paging/sorting/search via `RequestParam`
- Auditing fields with `BaseEntity` (`createdAt`, `updatedAt`)
- UUID identifiers for entities where applicable
- Centralized constants in `ApiConstants`, `MessageConstants`

## Service Design Guideline: Interface + Implementation (Required)

All services MUST:
- Define a service interface with abstract method signatures
- Provide a concrete implementation class that implements the interface
- Controllers depend on the interface (constructor injection)

Why:
- Improves testability (mock interfaces)
- Enforces clear contracts
- Allows swapping implementations without controller changes

Example:
```java
// service/UserService.java (INTERFACE)
public interface UserService {
    PaginationResponse<User> getUsers(RequestParam params);
    User getById(String id);
    void create(User user);
}
```

```java
// service/impl/UserServiceImpl.java (IMPLEMENTATION)
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    @Override
    public PaginationResponse<User> getUsers(RequestParam params) {
        // implement paging/specification logic
        // return ResponseUtils.createPaginatedResponse(page);
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public User getById(String id) {
        // repository + not-found handling
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public void create(User user) {
        // business validations + save
        throw new UnsupportedOperationException("Not implemented");
    }
}
```

```java
// controller/UserController.java (DEPEND ON INTERFACE)
@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/users")
@RequiredArgsConstructor
@Validated
public class UserController {
    private final UserService userService; // depends on the interface

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<User>>> list(@Valid RequestParam params) {
        var data = userService.getUsers(params);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }
}
```

## Standard Response Format

`BaseResponse<T>` fields: `success`, `message`, `data`, `errorCode`, `timestamp`.

Use `ResponseUtils` to build responses consistently:
```java
return ResponseEntity.ok(ResponseUtils.success("Operation completed", data));
// or for non-GET
return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS));
// error
return ResponseEntity.status(HttpStatus.NOT_FOUND)
    .body(ResponseUtils.error("User not found", ErrorCode.RESOURCE_NOT_FOUND.getCode()));
```

## Validation & Error Handling

Global handler returns the first validation error (sequential) and maps custom exceptions:
- `ResourceNotFoundException` → 404 RESOURCE_NOT_FOUND
- `BusinessException` → 400 with custom errorCode
- `ValidationException` and `MethodArgumentNotValidException` → 400 VALIDATION_ERROR
- Unhandled → 500 INTERNAL_SERVER_ERROR

## Pagination Best Practice

`RequestParam` centralizes paging/sorting/search:
- `page`, `size` (capped by `ApiConstants.MAX_PAGE_SIZE`)
- `sortBy`, `sortDirection`
- optional `search`, `status`, `dateFrom`, `dateTo`

Use with Spring Data and wrap with `PaginationResponse<T>` via `ResponseUtils.createPaginatedResponse(page)`.

## Entity Design Guidelines
- Inherit from `BaseEntity` for `createdAt`/`updatedAt` with `@PreUpdate` timestamp updates.
- Prefer UUID (`@GeneratedValue(strategy = GenerationType.UUID)`) when suitable.
- Use `@Enumerated(EnumType.STRING)` for enums (e.g., `SystemRole`).
- Keep columns explicit on nullability and length constraints.

## Constants & Error Codes
- `ApiConstants`: version, paging defaults, cache, security, file constraints, formats.
- `MessageConstants`: user-facing messages (success + validation).
- `ErrorCode`: stable machine-readable codes for clients.

## Testing Tips
- Unit test services by mocking repositories (mock `UserRepository`, inject `UserServiceImpl`).
- Slice/integration test controllers for request/response contracts and validation.
- Use builders/fixtures for DTOs to keep tests readable.

---
Adhere to these conventions when adding endpoints to keep behavior consistent, predictable, and easy to consume by the frontend.


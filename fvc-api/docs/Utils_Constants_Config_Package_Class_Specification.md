# Class Specification - Utils, Constants, Config Packages

## Utils Package

### 1. ResponseUtils

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Utility class with private constructor, no instance attributes |
| **Methods/Operations** |
| 01 | success(String message) | Visibility: public static
Return: BaseResponse<T>
Purpose: Creates a success response with message only
Parameters:
- `message: String` — success message |
| 02 | success(String message, T data) | Visibility: public static
Return: BaseResponse<T>
Purpose: Creates a success response with message and data
Parameters:
- `message: String` — success message
- `data: T` — response data of generic type |
| 03 | error(String message, String errorCode) | Visibility: public static
Return: BaseResponse<T>
Purpose: Creates an error response with message and error code
Parameters:
- `message: String` — error message
- `errorCode: String` — error code |
| 04 | createPaginatedResponse(Page<T> page) | Visibility: public static
Return: PaginationResponse<T>
Purpose: Creates a paginated response from Spring Data Page object
Parameters:
- `page: Page<T>` — Spring Data Page containing paginated data |

---

### 2. JwtUtils

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | jwtSecret | Visibility: private
Type: String
Purpose: JWT secret key from application properties |
| 02 | jwtExpirationMs | Visibility: private
Type: int
Purpose: JWT token expiration time in milliseconds from application properties |
| **Methods/Operations** |
| 01 | getSigningKey() | Visibility: private
Return: SecretKey
Purpose: Generates signing key from JWT secret
Parameters: None |
| 02 | generateJwtToken(User user) | Visibility: public
Return: String
Purpose: Generates JWT token for a user, uses personal mail if available, otherwise edu mail
Parameters:
- `user: User` — user entity to generate token for |
| 03 | generateTokenFromEmail(String email) | Visibility: public
Return: String
Purpose: Generates JWT token from email address
Parameters:
- `email: String` — email address to use as token subject |
| 04 | getEmailFromJwtToken(String token) | Visibility: public
Return: String
Purpose: Extracts email address from JWT token
Parameters:
- `token: String` — JWT token to extract email from |
| 05 | validateJwtToken(String authToken) | Visibility: public
Return: boolean
Purpose: Validates JWT token, returns true if valid, false otherwise
Parameters:
- `authToken: String` — JWT token to validate |

---

## Constants Package

### 3. ApiConstants

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | API_VERSION | Visibility: public static final
Type: String
Purpose: API version string, value: "v1" |
| 02 | API_BASE_PATH | Visibility: public static final
Type: String
Purpose: Base API path, value: "/api/v1" |
| 03 | DEFAULT_PAGE_SIZE | Visibility: public static final
Type: int
Purpose: Default pagination page size, value: 50 |
| 04 | MAX_PAGE_SIZE | Visibility: public static final
Type: int
Purpose: Maximum pagination page size, value: 100 |
| 05 | DEFAULT_SORT_BY | Visibility: public static final
Type: String
Purpose: Default sort field, value: "id" |
| 06 | DEFAULT_SORT_DIRECTION | Visibility: public static final
Type: String
Purpose: Default sort direction, value: "asc" |
| 07 | USER_CACHE | Visibility: public static final
Type: String
Purpose: User cache name, value: "users" |
| 08 | CACHE_TTL_SECONDS | Visibility: public static final
Type: int
Purpose: Cache time-to-live in seconds, value: 3600 |
| 09 | JWT_SECRET_KEY | Visibility: public static final
Type: String
Purpose: JWT secret key constant, value: "mySecretKey" |
| 10 | JWT_EXPIRATION_MS | Visibility: public static final
Type: int
Purpose: JWT expiration time in milliseconds (24 hours), value: 86400000 |
| 11 | MAX_FILE_SIZE | Visibility: public static final
Type: long
Purpose: Maximum file upload size in bytes (5MB), value: 5242880 |
| 12 | ALLOWED_FILE_TYPES | Visibility: public static final
Type: String[]
Purpose: Allowed file types for upload, value: {"jpg", "jpeg", "png", "gif", "pdf"} |
| 13 | DATE_FORMAT | Visibility: public static final
Type: String
Purpose: Date format pattern, value: "yyyy-MM-dd" |
| 14 | DATETIME_FORMAT | Visibility: public static final
Type: String
Purpose: DateTime format pattern, value: "yyyy-MM-dd HH:mm:ss" |
| 15 | WEIGHT_CLASSES_PATH | Visibility: public static final
Type: String
Purpose: Weight classes API path, value: "/weight-classes" |
| 16 | WEIGHT_CLASS_ID_PATH | Visibility: public static final
Type: String
Purpose: Weight class ID path parameter, value: "/{id}" |
| 17 | WEIGHT_CLASS_STATUS_PATH | Visibility: public static final
Type: String
Purpose: Weight class status path, value: "/{id}/status" |
| 18 | TOURNAMENT_FORMS_PATH | Visibility: public static final
Type: String
Purpose: Tournament forms API path, value: "/tournament-forms" |
| 19 | MUSIC_CONTENTS_PATH | Visibility: public static final
Type: String
Purpose: Music contents API path, value: "/music-contents" |
| 20 | MUSIC_CONTENT_ID_PATH | Visibility: public static final
Type: String
Purpose: Music content ID path parameter, value: "/{id}" |
| 21 | FIELDS_PATH | Visibility: public static final
Type: String
Purpose: Fields API path, value: "/fields" |
| 22 | FIELD_ID_PATH | Visibility: public static final
Type: String
Purpose: Field ID path parameter, value: "/{id}" |
| **Methods/Operations** |
| 01 | (None) | Utility class with private constructor, no methods |

---

### 4. MessageConstants

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01-132 | (Multiple constants) | Visibility: public static final
Type: String
Purpose: Various success, error, and validation messages for the application
Note: Contains messages for users, competitions, matches, fields, weight classes, application forms, etc. |
| **Methods/Operations** |
| 01 | (None) | Utility class with private constructor, no methods |

---

## Config Package

### 5. SecurityConfig

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | userDetailsService | Visibility: private final
Type: UserDetailsServiceImpl
Purpose: User details service for authentication |
| 02 | jwtAuthenticationFilter | Visibility: private final
Type: JwtAuthenticationFilter
Purpose: JWT authentication filter |
| **Methods/Operations** |
| 01 | passwordEncoder() | Visibility: public
Return: PasswordEncoder
Purpose: Creates BCrypt password encoder bean
Parameters: None |
| 02 | authenticationProvider() | Visibility: public
Return: DaoAuthenticationProvider
Purpose: Configures DAO authentication provider with user details service and password encoder
Parameters: None |
| 03 | authenticationManager(AuthenticationConfiguration config) | Visibility: public
Return: AuthenticationManager
Purpose: Creates authentication manager from configuration
Parameters:
- `config: AuthenticationConfiguration` — Spring Security authentication configuration |
| 04 | filterChain(HttpSecurity http) | Visibility: public
Return: SecurityFilterChain
Purpose: Configures security filter chain with CORS, CSRF, session management, and authorization rules
Parameters:
- `http: HttpSecurity` — HTTP security configuration builder |
| 05 | corsConfigurationSource() | Visibility: public
Return: CorsConfigurationSource
Purpose: Configures CORS settings for allowed origins, methods, headers, and credentials
Parameters: None |

---

### 6. WebSocketConfig

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Configuration class, no instance attributes |
| **Methods/Operations** |
| 01 | configureMessageBroker(MessageBrokerRegistry config) | Visibility: public
Return: void
Purpose: Configures message broker for WebSocket, enables simple broker on /topic and /queue, sets application destination prefix to /app
Parameters:
- `config: MessageBrokerRegistry` — message broker registry to configure |
| 02 | registerStompEndpoints(StompEndpointRegistry registry) | Visibility: public
Return: void
Purpose: Registers STOMP endpoints for WebSocket connections, adds /ws endpoint with SockJS fallback
Parameters:
- `registry: StompEndpointRegistry` — STOMP endpoint registry |

---

### 7. MailConfig

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | host | Visibility: private
Type: String
Purpose: SMTP host from application properties, default: "smtp.gmail.com" |
| 02 | port | Visibility: private
Type: int
Purpose: SMTP port from application properties, default: 587 |
| 03 | username | Visibility: private
Type: String
Purpose: SMTP username from application properties |
| 04 | password | Visibility: private
Type: String
Purpose: SMTP password from application properties |
| **Methods/Operations** |
| 01 | javaMailSender() | Visibility: public
Return: JavaMailSender
Purpose: Creates and configures JavaMailSender bean, only configures if credentials are provided
Parameters: None |

---

### 8. DataInitializer

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | userRepository | Visibility: private final
Type: UserRepository
Purpose: Repository for user operations |
| 02 | passwordEncoder | Visibility: private final
Type: PasswordEncoder
Purpose: Password encoder for hashing passwords |
| 03 | fistConfigRepository | Visibility: private final
Type: VovinamFistConfigRepository
Purpose: Repository for fist config operations |
| 04 | fistItemRepository | Visibility: private final
Type: VovinamFistItemRepository
Purpose: Repository for fist item operations |
| **Methods/Operations** |
| 01 | run(String... args) | Visibility: public
Return: void
Purpose: Initializes test data on application startup, creates admin user, regular user, assessor users, and fist configs/items
Parameters:
- `args: String...` — command line arguments |

---

### 9. DataSeeder

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | competitionRepository | Visibility: private final
Type: CompetitionRepository
Purpose: Repository for competition operations |
| 02 | formRepository | Visibility: private final
Type: ApplicationFormConfigRepository
Purpose: Repository for application form config operations |
| 03 | submittedRepository | Visibility: private final
Type: SubmittedApplicationFormRepository
Purpose: Repository for submitted application form operations |
| 04 | userRepository | Visibility: private final
Type: UserRepository
Purpose: Repository for user operations |
| **Methods/Operations** |
| 01 | seed() | Visibility: public
Return: void
Purpose: Seeds test data including competitions, application form configs, and submitted forms
Parameters: None |

---

### 10. WebSocketConnectionEventListener

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | messagingTemplate | Visibility: private final
Type: SimpMessagingTemplate
Purpose: Template for sending WebSocket messages |
| 02 | matchConnections | Visibility: private final
Type: Map<String, Map<String, ConnectionInfo>>
Purpose: Stores connected assessors by matchId and assessorId |
| **Methods/Operations** |
| 01 | handleWebSocketConnectListener(SessionConnectedEvent event) | Visibility: public
Return: void
Purpose: Handles WebSocket connection event, logs session ID
Parameters:
- `event: SessionConnectedEvent` — WebSocket connection event |
| 02 | handleWebSocketDisconnectListener(SessionDisconnectEvent event) | Visibility: public
Return: void
Purpose: Handles WebSocket disconnection event, removes assessor from connections and broadcasts status
Parameters:
- `event: SessionDisconnectEvent` — WebSocket disconnection event |
| 03 | handleSubscribeEvent(SessionSubscribeEvent event) | Visibility: public
Return: void
Purpose: Handles subscription event, extracts matchId and assessorId from destination and registers connection
Parameters:
- `event: SessionSubscribeEvent` — WebSocket subscription event |
| 04 | registerAssessorConnection(String matchId, String assessorId, String sessionId) | Visibility: public
Return: void
Purpose: Manually registers assessor connection for a match
Parameters:
- `matchId: String` — match identifier
- `assessorId: String` — assessor identifier
- `sessionId: String` — WebSocket session identifier |
| 05 | unregisterAssessorConnection(String matchId, String assessorId) | Visibility: public
Return: void
Purpose: Manually unregisters assessor connection for a match
Parameters:
- `matchId: String` — match identifier
- `assessorId: String` — assessor identifier |
| 06 | getConnectionStatus(String matchId) | Visibility: public
Return: AssessorConnectionStatus
Purpose: Gets current connection status for a match
Parameters:
- `matchId: String` — match identifier |
| 07 | notifyMatchEndedAndDisconnect(String matchId, String redScore, String blueScore, String winner) | Visibility: public
Return: void
Purpose: Notifies all connected assessors that match has ended and disconnects them
Parameters:
- `matchId: String` — match identifier
- `redScore: String` — red team score
- `blueScore: String` — blue team score
- `winner: String` — winner information |

---

### 11. OpenApiConfig

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Configuration class, no instance attributes |
| **Methods/Operations** |
| 01 | customOpenAPI() | Visibility: public
Return: OpenAPI
Purpose: Configures OpenAPI/Swagger documentation with API info, servers, and security schemes
Parameters: None |

---

## Package Structure

```
sep490g65.fvcapi
├── utils/
│   ├── ResponseUtils
│   └── JwtUtils
├── constants/
│   ├── ApiConstants
│   └── MessageConstants
└── config/
    ├── SecurityConfig
    ├── WebSocketConfig
    ├── MailConfig
    ├── DataInitializer
    ├── DataSeeder
    ├── WebSocketConnectionEventListener
    └── OpenApiConfig
```


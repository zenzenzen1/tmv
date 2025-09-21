# Cursor Rules for FVC Management System

## Project Overview
This is a full-stack application with:
- Backend: Spring Boot 3.5.6 (Java 21) in `fvc-api/`
- Frontend: React 19 TypeScript with Vite in `fvc-frontend/`

## Code Generation Rules

### General Principles
- Follow enterprise-level development patterns
- Implement proper separation of concerns
- Use clean architecture principles
- Implement comprehensive error handling
- Write self-documenting code with meaningful names
- Follow SOLID principles
- Use dependency injection patterns
- Implement proper logging and monitoring
- Ensure type safety throughout the application

## Backend (Spring Boot) Rules

### Architecture Patterns
- **Layered Architecture**: Controller → Service → Repository → Entity
- **DTO Pattern**: Use Data Transfer Objects for API contracts
- **Global Exception Handling**: Centralized error management
- **Response Wrapper Pattern**: Standardized API responses
- **Sequential Error Handling**: Return first validation error, then next

### Controller Structure
```java
@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/resource")
@Validated
@Slf4j
public class ResourceController {
    
    private final ResourceService resourceService;
    
    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }
    
    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<ResourceDto>>> getAllResources(
            @Valid @ModelAttribute RequestParam params) {
        try {
            PaginationResponse<ResourceDto> resources = resourceService.getAllResources(params);
            return ResponseEntity.ok(ResponseUtils.success("Resources retrieved successfully", resources));
        } catch (Exception e) {
            log.error("Error fetching resources", e);
            return ResponseUtils.error("Failed to fetch resources");
        }
    }
    
    @PostMapping
    public ResponseEntity<BaseResponse<ResourceDto>> createResource(
            @Valid @RequestBody CreateResourceRequest request) {
        ResourceDto resource = resourceService.createResource(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success(MessageConstants.RESOURCE_CREATED_SUCCESS, resource));
    }
}
```

### Service Layer Structure
```java
@Service
@Transactional
@Slf4j
public class ResourceServiceImpl implements ResourceService {
    
    private final ResourceRepository resourceRepository;
    private final ResourceMapper resourceMapper;
    
    public ResourceServiceImpl(ResourceRepository resourceRepository, 
                              ResourceMapper resourceMapper) {
        this.resourceRepository = resourceRepository;
        this.resourceMapper = resourceMapper;
    }
    
    @Override
    public ResourceDto createResource(CreateResourceRequest request) {
        // Validate business rules
        if (resourceRepository.existsByName(request.getName())) {
            throw new BusinessException(
                String.format(MessageConstants.RESOURCE_ALREADY_EXISTS, request.getName()),
                ErrorCode.RESOURCE_ALREADY_EXISTS.getCode()
            );
        }
        
        // Create and save resource
        Resource resource = resourceMapper.toEntity(request);
        Resource savedResource = resourceRepository.save(resource);
        
        log.info("Resource created successfully with ID: {}", savedResource.getId());
        return resourceMapper.toDto(savedResource);
    }
}
```

### Entity Design
```java
@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Name is required")
    private String name;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

### DTO Pattern
```java
// Request DTO with validation
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateResourceRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;
    
    @NotBlank(message = "Description is required")
    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
}

// Response DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDto {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Repository Pattern
```java
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    Optional<Resource> findByName(String name);
    
    boolean existsByName(String name);
    
    @Query("SELECT r FROM Resource r WHERE " +
           "(:search IS NULL OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Resource> findResourcesWithSearch(@Param("search") String search, Pageable pageable);
}
```

### Exception Handling
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<BaseResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(BaseResponse.error(ex.getMessage(), "RESOURCE_NOT_FOUND"));
    }
    
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

### Constants Management
```java
public final class ApiConstants {
    public static final String API_VERSION = "v1";
    public static final String API_BASE_PATH = "/api/" + API_VERSION;
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
}

public final class MessageConstants {
    public static final String RESOURCE_CREATED_SUCCESS = "Resource created successfully";
    public static final String RESOURCE_ALREADY_EXISTS = "Resource with name '%s' already exists";
}
```

## Frontend (React TypeScript) Rules

### Component Structure
```typescript
interface ComponentProps {
  // Define all props with proper types
  title: string;
  onAction?: (data: any) => void;
  loading?: boolean;
}

export const ComponentName: React.FC<ComponentProps> = ({
  title,
  onAction,
  loading = false,
  ...props
}) => {
  // Hooks at the top
  const [state, setState] = useState<Type>(initialValue);
  
  // Custom hooks
  const { data, loading: apiLoading, error } = useApi(apiFunction);
  
  // Event handlers
  const handleAction = useCallback((data: any) => {
    onAction?.(data);
  }, [onAction]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Early returns for loading/error states
  if (loading || apiLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // Main render
  return (
    <div className="component-container">
      {/* JSX content */}
    </div>
  );
};
```

### State Management with Zustand
```typescript
// Store structure
interface StoreState {
  data: DataType | null;
  loading: boolean;
  error: string | null;
}

interface StoreActions {
  fetchData: () => Promise<void>;
  setData: (data: DataType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useStore = create<StoreState & StoreActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        data: null,
        loading: false,
        error: null,
        
        // Actions
        fetchData: async () => {
          set({ loading: true, error: null });
          try {
            const response = await apiService.get<DataType>('/endpoint');
            set({ data: response.data, loading: false });
          } catch (error) {
            const { message } = globalErrorHandler(error);
            set({ error: message, loading: false });
          }
        },
        
        setData: (data) => set({ data }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        reset: () => set({ data: null, error: null, loading: false }),
      }),
      {
        name: 'store-name',
        storage: createJSONStorage(() => localStorage),
      }
    ),
    { name: 'store-name' }
  )
);
```

### API Service Integration
```typescript
// Service layer
export const resourceService = {
  getResources: async (params: RequestParams) => {
    return apiService.get<PaginationResponse<Resource>>('/resources', params);
  },
  
  getResource: async (id: string) => {
    return apiService.get<Resource>(`/resources/${id}`);
  },
  
  createResource: async (data: CreateResourceRequest) => {
    return apiService.post<Resource>('/resources', data);
  },
  
  updateResource: async (id: string, data: UpdateResourceRequest) => {
    return apiService.put<Resource>(`/resources/${id}`, data);
  },
  
  deleteResource: async (id: string) => {
    return apiService.delete(`/resources/${id}`);
  },
};
```

### Error Handling
```typescript
// Component error handling
const ComponentWithErrorHandling = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    try {
      setLoading(true);
      setError(null);
      await resourceService.createResource(data);
      // Handle success
    } catch (err) {
      const { message } = globalErrorHandler(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  if (error) {
    return <ErrorMessage error={error} onRetry={() => setError(null)} />;
  }
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

### Styling with Tailwind CSS
```typescript
// Component classes in index.css
@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6 border border-gray-200;
  }
  
  .input-field {
    @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500;
  }
}

// Component usage
const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  return (
    <button className={variantClasses[variant]} {...props}>
      {children}
    </button>
  );
};
```

### Custom Hooks
```typescript
// API hook
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiState<T> & UseApiActions<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const { message } = globalErrorHandler(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
```

## API Response Format Rules

### Standardized Response Structure
```typescript
// Success Response
interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Error Response
interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  timestamp: string;
}

// Pagination Response
interface PaginationResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

## Security Rules

### Backend Security
- Use Spring Security for authentication/authorization
- Validate all inputs with Jakarta Bean Validation
- Implement rate limiting
- Use HTTPS in production
- Sanitize database queries
- Implement proper CORS configuration
- Use JWT tokens for stateless authentication

### Frontend Security
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS in production
- Implement proper authentication flow
- Store sensitive data securely
- Implement CSRF protection

## Testing Rules

### Backend Testing
```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class ResourceServiceTest {
    
    @Autowired
    private ResourceService resourceService;
    
    @Test
    void shouldCreateResourceSuccessfully() {
        // Given
        CreateResourceRequest request = CreateResourceRequest.builder()
                .name("Test Resource")
                .description("Test Description")
                .build();
        
        // When
        ResourceDto result = resourceService.createResource(request);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Resource");
    }
}
```

### Frontend Testing
```typescript
describe('ResourceComponent', () => {
  it('should render resource data correctly', () => {
    // Test implementation
  });
  
  it('should handle loading state', () => {
    // Test implementation
  });
  
  it('should handle error state', () => {
    // Test implementation
  });
});
```

## Performance Rules

### Backend Performance
- Use connection pooling
- Implement proper indexing
- Use pagination for large datasets
- Implement caching where appropriate
- Monitor application performance
- Use lazy loading for relationships
- Optimize database queries

### Frontend Performance
- Use React.memo for expensive components
- Implement proper loading states
- Use lazy loading for routes
- Optimize bundle size
- Implement proper caching strategies
- Use useCallback and useMemo appropriately

## Documentation Rules

### Code Documentation
- Write meaningful comments for complex logic
- Use JSDoc for functions and components
- Document API endpoints with OpenAPI/Swagger
- Keep README files updated
- Document environment setup

### API Documentation
- Use OpenAPI 3.0 specification
- Document all endpoints with examples
- Include error response documentation
- Document authentication requirements
- Provide sample requests/responses

## Environment Configuration

### Backend Configuration
```properties
# Application configuration
spring.application.name=fvc-api
server.port=8080

# Database configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/fvc_api_db
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:password}

# JPA configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Logging configuration
logging.level.sep490g65.fvcapi=DEBUG
```

### Frontend Configuration
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## Code Quality Rules

### Java Quality
- Follow Java naming conventions
- Use proper access modifiers
- Implement proper equals/hashCode
- Use Optional for nullable returns
- Follow clean code principles
- Use Lombok annotations appropriately
- Implement proper logging with SLF4J

### TypeScript Quality
- Use strict mode
- Avoid `any` type
- Use proper type guards
- Implement proper null checks
- Use const assertions for enums
- Use type-only imports when required
- Implement proper error boundaries

## Prohibited Practices

### Backend Prohibitions
- Don't ignore exception handling
- Don't skip input validation
- Don't use deprecated APIs
- Don't ignore security best practices
- Don't commit sensitive data
- Don't ignore performance implications
- Don't skip code reviews
- Don't ignore logging requirements

### Frontend Prohibitions
- Don't use `any` type in TypeScript
- Don't ignore error handling
- Don't commit sensitive data
- Don't use deprecated APIs
- Don't skip input validation
- Don't ignore accessibility requirements
- Don't use inline styles in React
- Don't ignore performance implications
- Don't skip code reviews
- Don't ignore security best practices

## Code Generation Commands

When generating code, always:

1. **Check existing patterns** in the codebase first
2. **Follow the established architecture**
3. **Implement proper error handling**
4. **Add appropriate logging**
5. **Write tests for new functionality**
6. **Update documentation**
7. **Follow naming conventions**
8. **Use proper TypeScript types**
9. **Implement proper validation**
10. **Consider security implications**
11. **Use constants for magic numbers**
12. **Implement proper pagination**
13. **Follow sequential error handling**
14. **Use response wrapper pattern**
15. **Implement proper authentication**

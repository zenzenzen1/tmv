# Class Specification - Exception Package

## 1. BusinessException

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | errorCode | Visibility: private
Type: String
Purpose: Business error code, default is "BUSINESS_ERROR" |
| **Methods/Operations** |
| 01 | BusinessException(String message) | Visibility: public
Return: BusinessException
Purpose: Creates exception with error message, default errorCode
Parameters:
- `message: String` — error message |
| 02 | BusinessException(String message, String errorCode) | Visibility: public
Return: BusinessException
Purpose: Creates exception with error message and custom error code
Parameters:
- `message: String` — error message
- `errorCode: String` — custom error code |
| 03 | BusinessException(String message, Throwable cause) | Visibility: public
Return: BusinessException
Purpose: Creates exception with error message and cause, default errorCode
Parameters:
- `message: String` — error message
- `cause: Throwable` — underlying cause of the exception |
| 04 | BusinessException(String message, String errorCode, Throwable cause) | Visibility: public
Return: BusinessException
Purpose: Creates exception with error message, error code and cause
Parameters:
- `message: String` — error message
- `errorCode: String` — custom error code
- `cause: Throwable` — underlying cause of the exception |
| 05 | getErrorCode() | Visibility: public
Return: String
Purpose: Returns the business error code
Parameters: None |

---

## 2. GlobalExceptionHandler

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Class has no attributes, uses @RestControllerAdvice annotation |
| **Methods/Operations** |
| 01 | handleResourceNotFoundException(ResourceNotFoundException, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles exception when resource is not found, returns HTTP 404
Parameters:
- `ex: ResourceNotFoundException` — the exception to handle
- `request: WebRequest` — web request context |
| 02 | handleBusinessException(BusinessException, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles business exception, returns HTTP 400 with corresponding errorCode
Parameters:
- `ex: BusinessException` — the business exception to handle
- `request: WebRequest` — web request context |
| 03 | handleValidationException(ValidationException, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles validation exception, returns HTTP 400
Parameters:
- `ex: ValidationException` — the validation exception to handle
- `request: WebRequest` — web request context |
| 04 | handleBadCredentialsException(BadCredentialsException, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles authentication failure exception, returns HTTP 401
Parameters:
- `ex: BadCredentialsException` — the authentication exception to handle
- `request: WebRequest` — web request context |
| 05 | handleMethodArgumentNotValidException(MethodArgumentNotValidException, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles Spring validation exception, returns HTTP 400 with first error message
Parameters:
- `ex: MethodArgumentNotValidException` — the Spring validation exception to handle
- `request: WebRequest` — web request context |
| 06 | handleGlobalException(Exception, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles all unhandled exceptions, returns HTTP 500
Parameters:
- `ex: Exception` — any unhandled exception
- `request: WebRequest` — web request context |
| 07 | handleResponseStatusException(ResponseStatusException, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles ResponseStatusException, returns corresponding status code
Parameters:
- `ex: ResponseStatusException` — the response status exception to handle
- `request: WebRequest` — web request context |
| 08 | handleNoResourceFoundException(NoResourceFoundException, WebRequest) | Visibility: public
Return: ResponseEntity<BaseResponse<Void>>
Purpose: Handles Spring resource not found exception, returns HTTP 404
Parameters:
- `ex: NoResourceFoundException` — the Spring resource not found exception
- `request: WebRequest` — web request context |

---

## 3. ValidationException

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | errors | Visibility: private
Type: Map<String, String>
Purpose: Map containing validation errors with field name as key and error message as value |
| **Methods/Operations** |
| 01 | ValidationException(Map<String, String> errors) | Visibility: public
Return: ValidationException
Purpose: Creates exception with map of validation errors
Parameters:
- `errors: Map<String, String>` — map of field names to error messages |
| 02 | ValidationException(String field, String message) | Visibility: public
Return: ValidationException
Purpose: Creates exception with a single field and error message
Parameters:
- `field: String` — field name with validation error
- `message: String` — error message for the field |
| 03 | getErrors() | Visibility: public
Return: Map<String, String>
Purpose: Returns the map of validation errors
Parameters: None |

---

## 4. ResourceNotFoundException

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | resourceName | Visibility: private
Type: String
Purpose: Name of the resource not found (e.g., "User", "Competition") |
| 02 | fieldName | Visibility: private
Type: String
Purpose: Name of the field used for searching (e.g., "id", "email") |
| 03 | fieldValue | Visibility: private
Type: Object
Purpose: Value of the field used for searching |
| **Methods/Operations** |
| 01 | ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) | Visibility: public
Return: ResourceNotFoundException
Purpose: Creates exception with resource info, field and search value, automatically generates message
Parameters:
- `resourceName: String` — name of the resource type
- `fieldName: String` — name of the search field
- `fieldValue: Object` — value used in the search |
| 02 | ResourceNotFoundException(String message) | Visibility: public
Return: ResourceNotFoundException
Purpose: Creates exception with custom message, other fields are null
Parameters:
- `message: String` — custom error message |
| 03 | getResourceName() | Visibility: public
Return: String
Purpose: Returns the resource name
Parameters: None |
| 04 | getFieldName() | Visibility: public
Return: String
Purpose: Returns the field name
Parameters: None |
| 05 | getFieldValue() | Visibility: public
Return: Object
Purpose: Returns the field value
Parameters: None |

---

## 5. BusinessException (custom package)

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | errorCode | Visibility: private
Type: String
Purpose: Business error code, default is "BUSINESS_ERROR" |
| **Methods/Operations** |
| 01 | BusinessException(String message) | Visibility: public
Return: BusinessException
Purpose: Creates exception with error message, default errorCode
Parameters:
- `message: String` — error message |
| 02 | BusinessException(String message, String errorCode) | Visibility: public
Return: BusinessException
Purpose: Creates exception with error message and custom error code
Parameters:
- `message: String` — error message
- `errorCode: String` — custom error code |
| 03 | getErrorCode() | Visibility: public
Return: String
Purpose: Returns the business error code
Parameters: None |

---

## Package Structure

```
sep490g65.fvcapi.exception
├── BusinessException
├── GlobalExceptionHandler
└── custom/
    ├── BusinessException
    ├── ResourceNotFoundException
    └── ValidationException
```

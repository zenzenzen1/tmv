package sep490g65.fvcapi.enums;

import lombok.Getter;

@Getter
public enum ErrorCode {
    // Example error code
    USER_NOT_FOUND("USER_001", "User not found"),
    USER_ALREADY_EXISTS("USER_002", "User already exists"),
    INVALID_USER_CREDENTIALS("USER_003", "Invalid user credentials"),
    USER_ACCOUNT_DISABLED("USER_004", "User account is disabled"),

    // Example error validation
    VALIDATION_ERROR("VAL_001", "Validation error"),
    INVALID_INPUT("VAL_002", "Invalid input provided"),

    // Authentication errors
    UNAUTHORIZED("AUTH_001", "Unauthorized access"),
    TOKEN_EXPIRED("AUTH_002", "Token has expired"),
    INVALID_TOKEN("AUTH_003", "Invalid token"),

    // General errors
    INTERNAL_SERVER_ERROR("GEN_001", "Internal server error"),
    RESOURCE_NOT_FOUND("GEN_002", "Resource not found"),
    OPERATION_FAILED("GEN_003", "Operation failed");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
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
    OPERATION_FAILED("GEN_003", "Operation failed"),

    // Competition errors
    COMPETITION_NOT_FOUND("COMP_001", "Competition not found"),
    COMPETITION_ALREADY_EXISTS("COMP_002", "Competition already exists"),
    COMPETITION_FETCH_ERROR("COMP_003", "Failed to fetch competitions"),
    COMPETITION_CREATE_ERROR("COMP_004", "Failed to create competition"),
    COMPETITION_UPDATE_ERROR("COMP_005", "Failed to update competition"),
    COMPETITION_DELETE_ERROR("COMP_006", "Failed to delete competition"),
    COMPETITION_STATUS_CHANGE_ERROR("COMP_007", "Failed to change competition status"),

    // Competition validation errors
    INVALID_DATE_RANGE("COMP_VAL_001", "Invalid date range"),
    REGISTRATION_START_AFTER_END("COMP_VAL_002", "Registration start date must be before registration end date"),
    COMPETITION_START_AFTER_END("COMP_VAL_003", "Competition start date must be before competition end date"),
    REGISTRATION_END_AFTER_COMPETITION_START("COMP_VAL_004", "Registration end date cannot be after competition start date"),
    WEIGH_IN_BEFORE_REGISTRATION_END("COMP_VAL_005", "Weigh-in date cannot be before registration end date"),
    DRAW_DATE_BEFORE_WEIGH_IN("COMP_VAL_006", "Draw date cannot be before weigh-in date"),

    // Content linking errors
    FIST_CONFIG_NOT_FOUND("CONTENT_001", "Fist config not found"),
    FIST_ITEM_NOT_FOUND("CONTENT_002", "Fist item not found"),
    INVALID_FIST_ITEM_CONFIG("CONTENT_003", "Fist item does not belong to config"),
    WEIGHT_CLASS_NOT_FOUND("CONTENT_004", "Weight class not found"),
    MUSIC_PERFORMANCE_NOT_FOUND("CONTENT_005", "Music performance not found");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
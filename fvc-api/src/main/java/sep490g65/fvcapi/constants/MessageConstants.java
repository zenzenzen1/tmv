package sep490g65.fvcapi.constants;

public final class MessageConstants {
    private MessageConstants() {
        // Utility class
    }

    //Example Success Messages
    public static final String USER_CREATED_SUCCESS = "User created successfully";
    public static final String USER_UPDATED_SUCCESS = "User updated successfully";
    public static final String USER_DELETED_SUCCESS = "User deleted successfully";
    public static final String OPERATION_SUCCESS = "Operation completed successfully";

    //Example Error Messages
    public static final String USER_NOT_FOUND = "User not found with id: %s";
    public static final String USER_ALREADY_EXISTS = "User already exists with email: %s";
    public static final String INVALID_CREDENTIALS = "Invalid username or password";
    public static final String ACCESS_DENIED = "Access denied";
    public static final String VALIDATION_FAILED = "Validation failed";
    public static final String INTERNAL_ERROR = "An internal error occurred";

    //Example Validation Messages
    public static final String REQUIRED_FIELD = "%s is required";
    public static final String INVALID_EMAIL = "Invalid email format";
    public static final String PASSWORD_TOO_SHORT = "Password must be at least %d characters";
    public static final String INVALID_PHONE = "Invalid phone number format";
}
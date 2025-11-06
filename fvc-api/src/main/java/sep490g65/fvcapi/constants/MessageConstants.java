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

    // Weight Class Messages
    public static final String WEIGHT_CLASSES_RETRIEVED = "Weight classes retrieved";
    public static final String WEIGHT_CLASS_RETRIEVED = "Weight class retrieved";
    public static final String WEIGHT_CLASS_CREATED = "Weight class created";
    public static final String WEIGHT_CLASS_UPDATED = "Weight class updated";
    public static final String WEIGHT_CLASS_STATUS_UPDATED = "Status updated";
    public static final String WEIGHT_CLASS_DELETED = "Weight class deleted";

    // Weight Class Error Messages
    public static final String WEIGHT_CLASS_LOCKED_EDIT = "Locked weight class cannot be edited";
    public static final String WEIGHT_CLASS_DELETE_ONLY_DRAFT = "Only draft weight classes can be deleted";
    public static final String WEIGHT_CLASS_RANGE_INVALID = "Min weight must be less than max weight";
    public static final String WEIGHT_CLASS_OVERLAP_CONFLICT = "Overlapping active weight class for gender";
    public static final String WEIGHT_CLASS_CANNOT_UNLOCK = "Cannot unlock locked weight class";

    // General Messages
    public static final String DATA_RETRIEVED = "Data retrieved successfully";

    // Tournament Forms Messages
    public static final String TOURNAMENT_FORMS_RETRIEVED = "Tournament registration forms retrieved";
    public static final String TOURNAMENT_FORM_STATUS_UPDATED = "Form status updated";

    // Music Content Messages
    public static final String MUSIC_CONTENTS_RETRIEVED = "Music contents retrieved";
    public static final String MUSIC_CONTENT_RETRIEVED = "Music content retrieved";
    public static final String MUSIC_CONTENT_CREATED = "Music content created";
    public static final String MUSIC_CONTENT_UPDATED = "Music content updated";
    public static final String MUSIC_CONTENT_DELETED = "Music content deleted";

    // Competition Messages
    public static final String COMPETITIONS_RETRIEVED_SUCCESS = "Competitions retrieved successfully";
    public static final String COMPETITION_RETRIEVED_SUCCESS = "Competition retrieved successfully";
    public static final String COMPETITION_CREATED_SUCCESS = "Competition created successfully";
    public static final String COMPETITION_UPDATED_SUCCESS = "Competition updated successfully";
    public static final String COMPETITION_DELETED_SUCCESS = "Competition deleted successfully";
    public static final String COMPETITION_STATUS_UPDATED_SUCCESS = "Competition status updated successfully";

    // Competition Error Messages
    public static final String COMPETITION_NOT_FOUND = "Competition not found with id: %s";
    public static final String COMPETITION_ALREADY_EXISTS = "Competition with name '%s' already exists";
    public static final String COMPETITION_FETCH_ERROR = "Failed to fetch competitions";
    public static final String COMPETITION_CREATE_ERROR = "Failed to create competition";
    public static final String COMPETITION_UPDATE_ERROR = "Failed to update competition";
    public static final String COMPETITION_DELETE_ERROR = "Failed to delete competition";
    public static final String COMPETITION_STATUS_CHANGE_ERROR = "Failed to change competition status";

    // Competition Validation Messages
    public static final String INVALID_DATE_RANGE = "Invalid date range";
    public static final String REGISTRATION_START_AFTER_END = "Registration start date must be before registration end date";
    public static final String COMPETITION_START_AFTER_END = "Competition start date must be before competition end date";
    public static final String REGISTRATION_END_AFTER_COMPETITION_START = "Registration end date cannot be after competition start date";
    public static final String WEIGH_IN_BEFORE_REGISTRATION_END = "Weigh-in date cannot be before registration end date";
    public static final String DRAW_DATE_BEFORE_WEIGH_IN = "Draw date cannot be before weigh-in date";

    // Content Linking Error Messages
    public static final String FIST_CONFIG_NOT_FOUND = "Fist config not found with id: %s";
    public static final String FIST_ITEM_NOT_FOUND = "Fist item not found with id: %s";
    public static final String INVALID_FIST_ITEM_CONFIG = "Fist item %s does not belong to config %s";
    public static final String WEIGHT_CLASS_NOT_FOUND = "Weight class not found with id: %s";
    public static final String MUSIC_PERFORMANCE_NOT_FOUND = "Music performance not found with id: %s";

    // Competition Order Messages
    public static final String COMPETITION_ORDER_NOT_FOUND = "Competition order not found with id: %s";
    public static final String COMPETITION_ORDER_DUPLICATE_INDEX = "Order index %d already exists for competition %s";
    public static final String CONTENT_SELECTION_NOT_FOUND = "Content selection not found with id: %s";

    // Application Form Messages
    public static final String APPLICATION_FORM_CREATED_SUCCESS = "Application form created successfully";
    public static final String APPLICATION_FORM_UPDATED_SUCCESS = "Application form updated successfully";
    public static final String APPLICATION_FORM_RETRIEVED_SUCCESS = "Application form retrieved successfully";
    public static final String APPLICATION_FORMS_RETRIEVED_SUCCESS = "Application forms retrieved successfully";

    // Application Form Error Messages
    public static final String APPLICATION_FORM_NOT_FOUND = "Application form not found with id: %s";
    public static final String APPLICATION_FORM_ALREADY_EXISTS = "Application form with name '%s' already exists";
    public static final String APPLICATION_FORM_PUBLISH_WITHOUT_END_DATE = "Cannot publish form without end date";
    public static final String APPLICATION_FORM_CREATE_ERROR = "Failed to create application form";
    public static final String APPLICATION_FORM_UPDATE_ERROR = "Failed to update application form";

    // Match Scoring Messages
    public static final String MATCH_SCOREBOARD_RETRIEVED = "Match scoreboard retrieved successfully";
    public static final String MATCH_EVENTS_RETRIEVED = "Match events retrieved successfully";
    public static final String SCORE_EVENT_RECORDED = "Score event recorded successfully";
    public static final String MATCH_CONTROL_SUCCESS = "Match control action completed successfully";
    public static final String MATCH_EVENT_UNDONE = "Last match event undone successfully";

    // Match Scoring Error Messages
    public static final String MATCH_NOT_FOUND = "Match not found with id: %s";
    public static final String MATCH_ALREADY_ENDED = "Match has already ended";
    public static final String MATCH_NOT_IN_PROGRESS = "Match is not in progress";
    public static final String MATCH_CANNOT_UNDO = "Cannot undo: no events to undo";
    public static final String INVALID_MATCH_STATUS = "Invalid match status for this operation";
    public static final String INVALID_EVENT_TYPE = "Invalid event type for this operation";

    // Field Messages
    public static final String FIELDS_RETRIEVED = "Fields retrieved";
    public static final String FIELD_RETRIEVED = "Field retrieved";
    public static final String FIELD_CREATED = "Field created";
    public static final String FIELD_UPDATED = "Field updated";
    public static final String FIELD_DELETED = "Field deleted";

    // Field Error Messages
    public static final String FIELD_NOT_FOUND = "Field not found with id: %s";

}
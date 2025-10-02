package sep490g65.fvcapi.constants;

public final class ApiConstants {
    private ApiConstants() {
        // Utility class
    }

    // API Version
    public static final String API_VERSION = "v1";
    public static final String API_BASE_PATH = "/api/" + API_VERSION;

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String DEFAULT_SORT_BY = "id";
    public static final String DEFAULT_SORT_DIRECTION = "asc";

    // Cache
    public static final String USER_CACHE = "users";
    public static final int CACHE_TTL_SECONDS = 3600;

    // Security
    public static final String JWT_SECRET_KEY = "mySecretKey";
    public static final int JWT_EXPIRATION_MS = 86400000; // 24 hours

    // File Upload
    public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    public static final String[] ALLOWED_FILE_TYPES = {"jpg", "jpeg", "png", "gif", "pdf"};

    // Date Format
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

    // Resource Paths - Weight Classes
    public static final String WEIGHT_CLASSES_PATH = "/weight-classes";
    public static final String WEIGHT_CLASS_ID_PATH = "/{id}";
    public static final String WEIGHT_CLASS_STATUS_PATH = "/{id}/status";

    // Resource Paths - Music Integrated Performances
    public static final String MUSIC_CONTENTS_PATH = "/music-contents";
    public static final String MUSIC_CONTENT_ID_PATH = "/{id}";
}
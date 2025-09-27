package sep490g65.fvcapi.exception.custom;

import lombok.Getter;

import java.util.Map;

@Getter
public class ValidationException extends RuntimeException {
    private final Map<String, String> errors;

    public ValidationException(Map<String, String> errors) {
        super("Validation failed");
        this.errors = errors;
    }

    public ValidationException(String field, String message) {
        super("Validation failed");
        this.errors = Map.of(field, message);
    }
}
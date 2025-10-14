package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmittedFormData {
    @Size(max = 100, message = "Name must not exceed 100 characters")
    @Pattern(regexp = "^[\u00C0-\u024F\\p{L} .'-]+$", message = "Name must contain letters only")
    private String name;

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    @Pattern(regexp = "^[\u00C0-\u024F\\p{L} .'-]+$", message = "Full name must contain letters only")
    private String fullName;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    // Vietnam phone: 0x... or +84x...
    @Pattern(regexp = "^(0|\\+84)[3-9]\\d{8}$", message = "Invalid phone format")
    private String phone;

    @Pattern(regexp = "^(HE|SE|SS|SP)?\\d{6,8}$", message = "Invalid student code format")
    @Size(max = 10, message = "Student code must not exceed 10 characters")
    private String studentCode;

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;

    @Size(max = 100, message = "Club must not exceed 100 characters")
    private String club;
}

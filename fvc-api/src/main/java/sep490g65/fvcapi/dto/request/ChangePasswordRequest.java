package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
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
public class ChangePasswordRequest {
    
    @NotBlank(message = "Current password is required")
    private String currentPassword;
    
    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 64, message = "Password must be 8-64 characters")
    @Pattern(
            regexp = "^(?=\\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,64}$",
            message = "Password must have upper, lower, digit, special and no spaces"
    )
    private String newPassword;
    
    @NotBlank(message = "Confirm password is required")
    @Size(min = 8, max = 64, message = "Password must be 8-64 characters")
    @Pattern(
            regexp = "^(?=\\S+$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,64}$",
            message = "Password must have upper, lower, digit, special and no spaces"
    )
    private String confirmPassword;
}

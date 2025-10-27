package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    
    private String fullName;
    
    @Email(message = "Email should be valid")
    private String personalMail;
    
    @Email(message = "Email should be valid")
    private String eduMail;
    
    private String studentCode;
    
    private String gender;
    
    private LocalDate dob;
}

package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.SystemRole;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    
    private String id;
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String studentCode;
    private String gender;
    private LocalDate dob;
    private SystemRole systemRole;
    private String message;
}

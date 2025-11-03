package sep490g65.fvcapi.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String password;
    private String confirmPassword;
    private String studentCode;
    private LocalDate dob;
    private String gender;
}



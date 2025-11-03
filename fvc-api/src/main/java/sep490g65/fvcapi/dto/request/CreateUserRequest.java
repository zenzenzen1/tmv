package sep490g65.fvcapi.dto.request;

import lombok.Data;
import java.time.LocalDate;
import sep490g65.fvcapi.enums.SystemRole;

@Data
public class CreateUserRequest {
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String studentCode;
    private String password;
    private String gender;
    private LocalDate dob;
    private SystemRole systemRole;
}



package sep490g65.fvcapi.dto.response;

import lombok.Builder;
import lombok.Data;
import sep490g65.fvcapi.enums.SystemRole;

@Data
@Builder
public class RegisterResponse {
    private String id;
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String studentCode;
    private SystemRole systemRole;
    private String message;
}



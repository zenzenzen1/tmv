package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.SystemRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {
    
    private String id;
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String studentCode;
    private SystemRole systemRole;
    private String message;
}

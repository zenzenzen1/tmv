package sep490g65.fvcapi.dto.response;

import lombok.Builder;
import lombok.Data;
import sep490g65.fvcapi.enums.SystemRole;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ProfileResponse {
    private String id;
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String studentCode;
    private String gender;
    private LocalDate dob;
    private SystemRole systemRole;
    private Boolean status;
    private Boolean isInChallenge;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}



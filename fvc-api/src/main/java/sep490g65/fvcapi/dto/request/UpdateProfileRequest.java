package sep490g65.fvcapi.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String studentCode;
    private String gender;
    private String dob;
}



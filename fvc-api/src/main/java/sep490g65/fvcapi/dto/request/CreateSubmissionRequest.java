package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSubmissionRequest {
    @NotBlank
    private String fullName;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String studentId;

    @NotBlank
    private String club;

    @NotBlank
    private String gender; // MALE | FEMALE | OTHER

    // Entire submission payload as JSON string (includes dynamic fields)
    @NotBlank
    private String formDataJson;

    // New optional IDs for tight linking (preferred over names)
    private String weightClassId;     // for fighting
    private String fistConfigId;      // for quyen (config/group)
    private String fistItemId;        // for quyen (specific item)
    private String musicContentId;    // for music
}



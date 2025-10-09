package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.enums.ApplicationFormType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmittedApplicationFormResponse {
    private Long id;
    private ApplicationFormType formType;
    private String formData; // raw json string for now
    private ApplicationFormStatus status;
    private String reviewerNote;
    private String userId;
    private String applicationFormConfigId;

    // Flattened user info for convenience on FE
    private String userFullName;
    private String userPersonalMail;
    private String userEduMail;
    private String userStudentCode;
    private String userGender;
    private java.time.LocalDateTime createdAt;
}



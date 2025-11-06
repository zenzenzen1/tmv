package sep490g65.fvcapi.dto.request;

import lombok.Data;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;

@Data
public class UpdateFormRequest {
    private String name;
    private String description;
    private ApplicationFormType formType;
    private String competitionId;
    private FormStatus status; // DRAFT | PUBLISH | ARCHIVED | POSTPONE
    private java.time.LocalDateTime endDate;
    private java.util.List<FormFieldUpsert> fields;
}

// moved to its own file FormFieldUpsert.java



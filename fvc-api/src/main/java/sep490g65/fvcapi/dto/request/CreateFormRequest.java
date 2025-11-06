package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;

@Data
public class CreateFormRequest {
    @NotBlank
    private String name;

    private String description;

    @NotNull
    private ApplicationFormType formType;

    @NotBlank
    private String competitionId;
    private FormStatus status;
    private java.time.LocalDateTime endDate;
    private java.util.List<FormFieldUpsert> fields;
}



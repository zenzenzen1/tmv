package sep490g65.fvcapi.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.dto.validation.ConsistentSubmitForm;
import sep490g65.fvcapi.enums.ApplicationFormType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ConsistentSubmitForm
public class SubmitApplicationFormRequest {

    @NotNull(message = "Form type is required")
    private ApplicationFormType formType;

    @Valid
    @NotNull(message = "Form data is required")
    private SubmittedFormData formData;

    @Size(max = 255, message = "Reviewer note must not exceed 255 characters")
    private String reviewerNote;

    private String userId; // Optional - can be null

    private String applicationFormConfigId;
}

package sep490g65.fvcapi.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.ApplicationFormType;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApplicationFormConfigRequest {

    @NotBlank(message = "Form name is required")
    private String name;

    @NotBlank(message = "Form description is required")
    private String description;

    @NotNull(message = "Form type is required")
    private ApplicationFormType formType;

    @Valid
    private List<ApplicationFormFieldRequest> fields;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationFormFieldRequest {
        private String label;
        private String name;
        private String fieldType;
        private Boolean required;
        private String options;
        private Integer sortOrder;
    }
}

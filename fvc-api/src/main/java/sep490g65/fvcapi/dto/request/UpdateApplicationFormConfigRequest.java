package sep490g65.fvcapi.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class UpdateApplicationFormConfigRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
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
        private String id;

        @NotBlank(message = "Field label is required")
        @Size(max = 100, message = "Field label must not exceed 100 characters")
        private String label;

        @NotBlank(message = "Field name is required")
        @Size(max = 50, message = "Field name must not exceed 50 characters")
        private String name;

        @NotBlank(message = "Field type is required")
        @Size(max = 30, message = "Field type must not exceed 30 characters")
        private String fieldType;

        @NotNull(message = "Required field is required")
        private Boolean required;

        private String options;

        @NotNull(message = "Sort order is required")
        private Integer sortOrder;
    }
}

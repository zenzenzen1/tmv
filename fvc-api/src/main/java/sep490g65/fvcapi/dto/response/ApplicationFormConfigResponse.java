package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationFormConfigResponse {

    private String id;
    private String name;
    private String description;
    private ApplicationFormType formType;
    private List<ApplicationFormFieldResponse> fields;
    private LocalDateTime endDate;
    private FormStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String publicLink;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationFormFieldResponse {
        private String id;
        private String label;
        private String name;
        private String fieldType;
        private Boolean required;
        private String options;
        private Integer sortOrder;
    }
}

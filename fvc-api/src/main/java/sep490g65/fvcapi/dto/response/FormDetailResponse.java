package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormDetailResponse {
    private String id;
    private String name;
    private String description;
    private ApplicationFormType formType;
    private String competitionId;
    private FormStatus status;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private java.util.List<FormFieldDto> fields;
    private String publicSlug;
    private String publicLink;
}



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
public class PublicApplicationFormResponse {
    private String id;
    private String name;
    private String description;
    private ApplicationFormType formType;
    private FormStatus status;
    private LocalDateTime endDate;
    private LocalDateTime updatedAt;
    private String publicSlug;
    private String publicLink;
    private boolean expired;
}


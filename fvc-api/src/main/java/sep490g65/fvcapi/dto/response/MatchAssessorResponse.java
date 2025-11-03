package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.AssessorRole;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchAssessorResponse {
    private String id;
    private String matchId;
    private String userId;
    private String userFullName;
    private String userEmail;
    private Integer position;
    private AssessorRole role;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


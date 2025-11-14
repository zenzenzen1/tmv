package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.enums.AssessorRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignAssessorRequest {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    // Cho quyền/võ nhạc: performanceId (nullable khi là đối kháng)
    private String performanceId;
    
    // Cho quyền/võ nhạc: performanceMatchId (nullable khi là đối kháng)
    private String performanceMatchId;
    
    // Cho đối kháng: matchId (nullable khi là quyền/võ nhạc)
    private String matchId;
    
    @NotNull(message = "Specialization is required")
    private MatchAssessor.Specialization specialization;
    
    // Cho đối kháng: role và position (nullable cho quyền/võ nhạc)
    private AssessorRole role;
    private Integer position;
}


package sep490g65.fvcapi.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhaseTeamStatsDto {
    private String phaseId;
    private String teamId;
    private String phaseName;
    private String teamCode;
    private long currentMembers;
    private long eliminatedMembers;
    private Double attendanceRate;
    private Double passRate;
    private Integer requiredCount;
    private String status; // on_track / at_risk
}



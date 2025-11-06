package sep490g65.fvcapi.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberRiskDto {
    private String userId;
    private String name;
    private String teamCode;
    private String riskLevel; // high/medium/low
}



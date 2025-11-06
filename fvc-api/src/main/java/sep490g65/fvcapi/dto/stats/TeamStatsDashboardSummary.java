package sep490g65.fvcapi.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamStatsDashboardSummary {
    private long totalActiveMembers;
    private long eliminatedMembers;
    private double averageAttendanceRate;
    private double averagePassRate;
}



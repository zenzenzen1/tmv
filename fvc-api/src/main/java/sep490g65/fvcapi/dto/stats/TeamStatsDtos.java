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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class PhaseTeamStatsDto {
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class PhaseTeamDetailStatsDto {
    private String phaseId;
    private String teamId;
    private String teamName;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class TeamMemberRiskDto {
    private String userId;
    private String name;
    private String teamCode;
    private String riskLevel; // high/medium/low
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class StatsFilterParams {
    private String cycleId;
    private String phaseId;
    private String teamId;
    private String dateFrom;
    private String dateTo;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class StatsDetailParams {
    private String dummy;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class StatsExportRequest {
    private StatsFilterParams filters;
    private String format; // CSV or XLSX
}



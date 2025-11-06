package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.stats.*;

public interface TeamStatsService {
    TeamStatsDashboardSummary getDashboardSummary(StatsFilterParams params);
    Page<PhaseTeamStatsDto> getPhaseBreakdown(StatsFilterParams params, Pageable pageable);
    PhaseTeamDetailStatsDto getPhaseTeamDetail(String phaseId, String teamId, StatsDetailParams params);
    Page<TeamMemberRiskDto> getAtRiskMembers(StatsFilterParams params, Pageable pageable);
    byte[] export(StatsExportRequest request);
}



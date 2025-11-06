package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.stats.*;
import sep490g65.fvcapi.service.TeamStatsService;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamStatsServiceImpl implements TeamStatsService {

    @Override
    public TeamStatsDashboardSummary getDashboardSummary(StatsFilterParams params) {
        return TeamStatsDashboardSummary.builder()
                .totalActiveMembers(0)
                .eliminatedMembers(0)
                .averageAttendanceRate(0)
                .averagePassRate(0)
                .build();
    }

    @Override
    public Page<PhaseTeamStatsDto> getPhaseBreakdown(StatsFilterParams params, Pageable pageable) {
        return new PageImpl<>(Collections.emptyList(), pageable, 0);
    }

    @Override
    public PhaseTeamDetailStatsDto getPhaseTeamDetail(String phaseId, String teamId, StatsDetailParams params) {
        return PhaseTeamDetailStatsDto.builder()
                .phaseId(phaseId)
                .teamId(teamId)
                .teamName(null)
                .build();
    }

    @Override
    public Page<TeamMemberRiskDto> getAtRiskMembers(StatsFilterParams params, Pageable pageable) {
        return new PageImpl<>(Collections.emptyList(), pageable, 0);
    }

    @Override
    public byte[] export(StatsExportRequest request) {
        return new byte[0];
    }
}



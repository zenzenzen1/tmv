package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.stats.*;
import sep490g65.fvcapi.service.TeamStatsService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/stats")
@Validated
@RequiredArgsConstructor
public class TeamStatsController {

    private final TeamStatsService teamStatsService;

    @GetMapping("/dashboard")
    public ResponseEntity<BaseResponse<TeamStatsDashboardSummary>> dashboard(StatsFilterParams params) {
        return ResponseEntity.ok(ResponseUtils.success("Stats summary", teamStatsService.getDashboardSummary(params)));
    }

    @GetMapping("/phase-team")
    public ResponseEntity<BaseResponse<PaginationResponse<PhaseTeamStatsDto>>> phaseBreakdown(StatsFilterParams params, Pageable pageable) {
        Page<PhaseTeamStatsDto> page = teamStatsService.getPhaseBreakdown(params, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Phase-team stats", ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping("/phase-team/{phaseId}/{teamId}")
    public ResponseEntity<BaseResponse<PhaseTeamDetailStatsDto>> phaseTeamDetail(@PathVariable String phaseId, @PathVariable String teamId, StatsDetailParams params) {
        return ResponseEntity.ok(ResponseUtils.success("Phase-team detail", teamStatsService.getPhaseTeamDetail(phaseId, teamId, params)));
    }

    @GetMapping("/at-risk")
    public ResponseEntity<BaseResponse<PaginationResponse<TeamMemberRiskDto>>> atRisk(StatsFilterParams params, Pageable pageable) {
        Page<TeamMemberRiskDto> page = teamStatsService.getAtRiskMembers(params, pageable);
        return ResponseEntity.ok(ResponseUtils.success("At-risk members", ResponseUtils.createPaginatedResponse(page)));
    }

    @PostMapping("/export")
    public ResponseEntity<BaseResponse<byte[]>> export(@RequestBody StatsExportRequest request) {
        return ResponseEntity.ok(ResponseUtils.success("Export generated", teamStatsService.export(request)));
    }
}



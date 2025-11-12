package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.dto.request.CreatePerformanceMatchRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PerformanceMatchResponse;
import sep490g65.fvcapi.entity.PerformanceMatch;
import sep490g65.fvcapi.service.PerformanceMatchService;
import sep490g65.fvcapi.utils.ResponseUtils;
import sep490g65.fvcapi.dto.request.SavePerformanceMatchSetupRequest;
import sep490g65.fvcapi.dto.response.AssessorResponse;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/performance-matches")
@RequiredArgsConstructor
public class PerformanceMatchController {

    private final PerformanceMatchService performanceMatchService;

    @PostMapping
    public ResponseEntity<PerformanceMatchResponse> createPerformanceMatch(@Valid @RequestBody CreatePerformanceMatchRequest request) {
        PerformanceMatchResponse response = performanceMatchService.createPerformanceMatch(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<sep490g65.fvcapi.dto.response.BaseResponse<PerformanceMatchResponse>> getPerformanceMatchById(@PathVariable String id) {
        PerformanceMatchResponse response = performanceMatchService.getPerformanceMatchById(id);
        return ResponseEntity.ok(sep490g65.fvcapi.utils.ResponseUtils.success("Performance match retrieved", response));
    }

    @GetMapping("/performance/{performanceId}")
    public ResponseEntity<sep490g65.fvcapi.dto.response.BaseResponse<PerformanceMatchResponse>> getPerformanceMatchByPerformanceId(@PathVariable String performanceId) {
        PerformanceMatchResponse response = performanceMatchService.getPerformanceMatchByPerformanceId(performanceId);
        return ResponseEntity.ok(sep490g65.fvcapi.utils.ResponseUtils.success("Performance match retrieved", response));
    }

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<sep490g65.fvcapi.dto.response.BaseResponse<List<PerformanceMatchResponse>>> getPerformanceMatchesByCompetitionId(@PathVariable String competitionId) {
        List<PerformanceMatchResponse> responses = performanceMatchService.getPerformanceMatchesByCompetitionId(competitionId);
        return ResponseEntity.ok(sep490g65.fvcapi.utils.ResponseUtils.success("Performance matches retrieved", responses));
    }

    @GetMapping("/{performanceMatchId}/assessors")
    public ResponseEntity<BaseResponse<List<AssessorResponse>>> getAssessorsByPerformanceMatch(
            @PathVariable String performanceMatchId) {
        List<AssessorResponse> responses = performanceMatchService.getAssessorsByPerformanceMatchId(performanceMatchId);
        return ResponseEntity.ok(ResponseUtils.success("Assessors retrieved", responses));
    }

    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<PerformanceMatchResponse> updatePerformanceMatchStatus(
            @PathVariable String id,
            @PathVariable PerformanceMatch.MatchStatus status) {
        PerformanceMatchResponse response = performanceMatchService.updatePerformanceMatchStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PerformanceMatchResponse> updatePerformanceMatch(
            @PathVariable String id,
            @Valid @RequestBody CreatePerformanceMatchRequest request) {
        PerformanceMatchResponse response = performanceMatchService.updatePerformanceMatch(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePerformanceMatch(@PathVariable String id) {
        performanceMatchService.deletePerformanceMatch(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/performance/{performanceId}/save")
    public ResponseEntity<BaseResponse<PerformanceMatchResponse>> savePerformanceMatchSetup(
            @PathVariable String performanceId,
            @RequestBody(required = false) SavePerformanceMatchSetupRequest body) {
        PerformanceMatchResponse response = performanceMatchService.savePerformanceMatchSetup(performanceId, body);
        return ResponseEntity.ok(ResponseUtils.success("Performance match setup saved successfully", response));
    }
}


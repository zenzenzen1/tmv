package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.dto.request.SubmitScoreRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.AssessorScore;
import sep490g65.fvcapi.service.ScoringService;
import sep490g65.fvcapi.service.PerformanceScoringService;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/scoring")
@RequiredArgsConstructor
public class ScoringController {

    private final ScoringService scoringService; // might handle other modes
    private final PerformanceScoringService performanceScoringService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitScore(@Valid @RequestBody SubmitScoreRequest request) {
        try {
            AssessorScore score = performanceScoringService.submitScore(request);
            return ResponseEntity.ok(score);
        } catch (RuntimeException ex) {
            // Map business validation errors to 400 instead of 500
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of(
                            "success", false,
                            "message", ex.getMessage(),
                            "error", "VALIDATION_ERROR"));
        }
    }

    @GetMapping("/performance/{performanceId}")
    public ResponseEntity<PerformanceResponse> getPerformanceScores(@PathVariable String performanceId) {
        PerformanceResponse response = performanceScoringService.getPerformanceScores(performanceId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/performance/{performanceId}/average")
    public ResponseEntity<BigDecimal> getAverageScore(@PathVariable String performanceId) {
        BigDecimal averageScore = performanceScoringService.calculateAverageScore(performanceId);
        return ResponseEntity.ok(averageScore);
    }

    @GetMapping("/performance/{performanceId}/scores")
    public ResponseEntity<List<AssessorScore>> getScoresByPerformanceId(@PathVariable String performanceId) {
        List<AssessorScore> scores = performanceScoringService.getScoresByPerformanceId(performanceId);
        return ResponseEntity.ok(scores);
    }

    @GetMapping("/assessor/{assessorId}/scores")
    public ResponseEntity<List<AssessorScore>> getScoresByAssessorId(@PathVariable String assessorId) {
        List<AssessorScore> scores = scoringService.getScoresByAssessorId(assessorId);
        return ResponseEntity.ok(scores);
    }

    @PutMapping("/scores/{scoreId}")
    public ResponseEntity<AssessorScore> updateScore(
            @PathVariable String scoreId,
            @RequestParam BigDecimal newScore,
            @RequestParam(required = false) String criteriaScores,
            @RequestParam(required = false) String notes) {
        AssessorScore updatedScore = scoringService.updateScore(scoreId, newScore, criteriaScores, notes);
        return ResponseEntity.ok(updatedScore);
    }

    @DeleteMapping("/scores/{scoreId}")
    public ResponseEntity<Void> deleteScore(@PathVariable String scoreId) {
        scoringService.deleteScore(scoreId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/performance/{performanceId}/remaining-assessors")
    public ResponseEntity<Integer> getRemainingAssessors(@PathVariable String performanceId) {
        int remaining = scoringService.getRemainingAssessors(performanceId);
        return ResponseEntity.ok(remaining);
    }

    @GetMapping("/performance/{performanceId}/total-assessors")
    public ResponseEntity<Integer> getTotalAssessors(@PathVariable String performanceId) {
        int total = scoringService.getTotalAssessors(performanceId);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/assessor/{assessorId}/performance/{performanceId}/can-score")
    public ResponseEntity<Boolean> canAssessorScore(
            @PathVariable String assessorId,
            @PathVariable String performanceId) {
        boolean canScore = scoringService.canAssessorScore(assessorId, performanceId);
        return ResponseEntity.ok(canScore);
    }

    @GetMapping("/performance/{performanceId}/is-active")
    public ResponseEntity<Boolean> isPerformanceActive(@PathVariable String performanceId) {
        boolean isActive = scoringService.isPerformanceActive(performanceId);
        return ResponseEntity.ok(isActive);
    }
}

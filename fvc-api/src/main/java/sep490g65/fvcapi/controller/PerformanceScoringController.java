package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.dto.request.SubmitScoreRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.AssessorScore;
import sep490g65.fvcapi.service.PerformanceScoringService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/performance-scoring")
@RequiredArgsConstructor
public class PerformanceScoringController {

    private final PerformanceScoringService performanceScoringService;

    @PostMapping("/submit")
    public ResponseEntity<AssessorScore> submitScore(@Valid @RequestBody SubmitScoreRequest request) {
        AssessorScore score = performanceScoringService.submitScore(request);
        return ResponseEntity.ok(score);
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
}



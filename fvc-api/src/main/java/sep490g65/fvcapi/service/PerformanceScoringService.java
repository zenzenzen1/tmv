package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.SubmitScoreRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.AssessorScore;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dedicated service for Quyền/Võ nhạc (performance-based) scoring.
 */
public interface PerformanceScoringService {

    AssessorScore submitScore(SubmitScoreRequest request);

    PerformanceResponse getPerformanceScores(String performanceId);

    BigDecimal calculateAverageScore(String performanceId);

    List<AssessorScore> getScoresByPerformanceId(String performanceId);

    List<AssessorScore> getScoresByAssessorId(String assessorId);

    AssessorScore updateScore(String scoreId, BigDecimal newScore, String criteriaScores, String notes);

    void deleteScore(String scoreId);

    boolean canAssessorScore(String assessorId, String performanceId);

    boolean isPerformanceActive(String performanceId);

    int getRemainingAssessors(String performanceId);

    int getTotalAssessors(String performanceId);
}



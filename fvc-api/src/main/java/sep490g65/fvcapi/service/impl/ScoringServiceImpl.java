package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.SubmitScoreRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.Assessor;
import sep490g65.fvcapi.entity.AssessorScore;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.repository.AssessorRepository;
import sep490g65.fvcapi.repository.AssessorScoreRepository;
import sep490g65.fvcapi.repository.PerformanceRepository;
import sep490g65.fvcapi.service.PerformanceService;
import sep490g65.fvcapi.service.ScoringService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScoringServiceImpl implements ScoringService {

    private final AssessorScoreRepository assessorScoreRepository;
    private final AssessorRepository assessorRepository;
    private final PerformanceRepository performanceRepository;
    private final PerformanceService performanceService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public AssessorScore submitScore(SubmitScoreRequest request) {
        // Validate assessor can score this performance
        if (!canAssessorScore(request.getAssessorId(), request.getPerformanceId())) {
            throw new RuntimeException("Assessor is not authorized to score this performance");
        }

        // Validate performance is eligible to score
        if (!isPerformanceActive(request.getPerformanceId())) {
            throw new RuntimeException("Performance is not eligible for scoring");
        }

        // Check if score already exists
        if (assessorScoreRepository.existsByPerformanceIdAndAssessorId(request.getPerformanceId(), request.getAssessorId())) {
            throw new RuntimeException("Score already submitted for this performance");
        }

        // Create and save score
        AssessorScore score = AssessorScore.builder()
                .performance(performanceRepository.findById(request.getPerformanceId()).orElseThrow())
                .assessor(assessorRepository.findById(request.getAssessorId()).orElseThrow())
                .score(request.getScore())
                .criteriaScores(request.getCriteriaScores())
                .notes(request.getNotes())
                .submittedAt(LocalDateTime.now())
                .build();

        AssessorScore savedScore = assessorScoreRepository.save(score);

        // Update performance total score
        updatePerformanceTotalScore(request.getPerformanceId());

        // Broadcast score submission to performance topic for real-time projection/judge screens
        try {
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("type", "SCORE_SUBMITTED");
            payload.put("performanceId", request.getPerformanceId());
            payload.put("assessorId", request.getAssessorId());
            payload.put("score", request.getScore());
            payload.put("submittedAt", savedScore.getSubmittedAt());
            messagingTemplate.convertAndSend("/topic/performance/" + request.getPerformanceId() + "/score-submitted", payload);
        } catch (Exception ignored) {}

        return savedScore;
    }

    @Override
    public PerformanceResponse getPerformanceScores(String performanceId) {
        return performanceService.getPerformanceById(performanceId);
    }

    @Override
    public BigDecimal calculateAverageScore(String performanceId) {
        BigDecimal averageScore = assessorScoreRepository.calculateAverageScoreByPerformanceId(performanceId);
        return averageScore != null ? averageScore : BigDecimal.ZERO;
    }

    @Override
    public List<AssessorScore> getScoresByPerformanceId(String performanceId) {
        return assessorScoreRepository.findByPerformanceIdOrderBySubmittedAt(performanceId);
    }

    @Override
    public List<AssessorScore> getScoresByAssessorId(String assessorId) {
        return assessorScoreRepository.findByAssessorId(assessorId);
    }

    @Override
    @Transactional
    public AssessorScore updateScore(String scoreId, BigDecimal newScore, String criteriaScores, String notes) {
        AssessorScore score = assessorScoreRepository.findById(scoreId)
                .orElseThrow(() -> new RuntimeException("Score not found"));

        score.setScore(newScore);
        score.setCriteriaScores(criteriaScores);
        score.setNotes(notes);
        score.setSubmittedAt(LocalDateTime.now());

        AssessorScore updatedScore = assessorScoreRepository.save(score);

        // Update performance total score
        updatePerformanceTotalScore(score.getPerformance().getId());

        // Broadcast score update
        try {
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("type", "SCORE_UPDATED");
            payload.put("performanceId", score.getPerformance().getId());
            payload.put("assessorId", score.getAssessor().getId());
            payload.put("score", updatedScore.getScore());
            payload.put("submittedAt", updatedScore.getSubmittedAt());
            messagingTemplate.convertAndSend("/topic/performance/" + score.getPerformance().getId() + "/score-submitted", payload);
        } catch (Exception ignored) {}

        return updatedScore;
    }

    @Override
    @Transactional
    public void deleteScore(String scoreId) {
        AssessorScore score = assessorScoreRepository.findById(scoreId)
                .orElseThrow(() -> new RuntimeException("Score not found"));

        String performanceId = score.getPerformance().getId();
        assessorScoreRepository.delete(score);

        // Update performance total score
        updatePerformanceTotalScore(performanceId);

        // Broadcast score deletion
        try {
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("type", "SCORE_DELETED");
            payload.put("performanceId", performanceId);
            payload.put("scoreId", scoreId);
            messagingTemplate.convertAndSend("/topic/performance/" + performanceId + "/score-submitted", payload);
        } catch (Exception ignored) {}
    }

    @Override
    public boolean canAssessorScore(String assessorId, String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        Assessor assessor = assessorRepository.findById(assessorId)
                .orElseThrow(() -> new RuntimeException("Assessor not found"));

        // For quyền/võ nhạc: check if assessor is assigned to this performance
        if (performance.getContentType() == Performance.ContentType.QUYEN || 
            performance.getContentType() == Performance.ContentType.MUSIC) {
            return assessorRepository.existsByUserIdAndPerformanceId(
                    assessor.getUser().getId(),
                    performanceId
            );
        }
        
        // For fighting: check by match_id (if match_id exists in performance)
        // Note: This might need adjustment based on how matches are linked to performances
        return assessor.getPerformance() != null && 
               assessor.getPerformance().getId().equals(performanceId);
    }

    @Override
    public boolean isPerformanceActive(String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        
        // Align with Quyền/Võ nhạc rule: score only after COMPLETED (also safe for fighting if needed)
        return performance.getStatus() == Performance.PerformanceStatus.COMPLETED;
    }

    @Override
    public int getRemainingAssessors(String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        // Get total assessors for this performance
        Assessor.Specialization specialization = performance.getContentType() == Performance.ContentType.QUYEN ? 
                    Assessor.Specialization.QUYEN : 
                    performance.getContentType() == Performance.ContentType.MUSIC ? 
                        Assessor.Specialization.MUSIC : 
                        Assessor.Specialization.FIGHTING;
        
        long totalAssessors = assessorRepository.countByPerformanceIdAndSpecialization(
                performanceId,
                specialization
        );

        // Get submitted scores count
        long submittedScores = assessorScoreRepository.countByPerformanceId(performanceId);

        return (int) (totalAssessors - submittedScores);
    }

    @Override
    public int getTotalAssessors(String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        Assessor.Specialization specialization = performance.getContentType() == Performance.ContentType.QUYEN ? 
                    Assessor.Specialization.QUYEN : 
                    performance.getContentType() == Performance.ContentType.MUSIC ? 
                        Assessor.Specialization.MUSIC : 
                        Assessor.Specialization.FIGHTING;

        return (int) assessorRepository.countByPerformanceIdAndSpecialization(
                performanceId,
                specialization
        );
    }

    private void updatePerformanceTotalScore(String performanceId) {
        BigDecimal averageScore = calculateAverageScore(performanceId);
        
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        
        performance.setTotalScore(averageScore);
        performanceRepository.save(performance);
    }
}

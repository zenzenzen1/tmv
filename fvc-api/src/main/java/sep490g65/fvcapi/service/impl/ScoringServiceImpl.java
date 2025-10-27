package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
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

    @Override
    @Transactional
    public AssessorScore submitScore(SubmitScoreRequest request) {
        // Validate assessor can score this performance
        if (!canAssessorScore(request.getAssessorId(), request.getPerformanceId())) {
            throw new RuntimeException("Assessor is not authorized to score this performance");
        }

        // Validate performance is active
        if (!isPerformanceActive(request.getPerformanceId())) {
            throw new RuntimeException("Performance is not active for scoring");
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
    }

    @Override
    public boolean canAssessorScore(String assessorId, String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        // Check if assessor exists and is assigned to the competition
        return assessorRepository.existsByUserIdAndCompetitionId(
                assessorRepository.findById(assessorId).orElseThrow().getUser().getId(),
                performance.getCompetition().getId()
        );
    }

    @Override
    public boolean isPerformanceActive(String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        
        return performance.getStatus() == Performance.PerformanceStatus.IN_PROGRESS;
    }

    @Override
    public int getRemainingAssessors(String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        // Get total assessors for this content type
        long totalAssessors = assessorRepository.countByCompetitionIdAndSpecialization(
                performance.getCompetition().getId(),
                performance.getContentType() == Performance.ContentType.QUYEN ? 
                    Assessor.Specialization.QUYEN : 
                    performance.getContentType() == Performance.ContentType.MUSIC ? 
                        Assessor.Specialization.MUSIC : 
                        Assessor.Specialization.FIGHTING
        );

        // Get submitted scores count
        long submittedScores = assessorScoreRepository.countByPerformanceId(performanceId);

        return (int) (totalAssessors - submittedScores);
    }

    @Override
    public int getTotalAssessors(String performanceId) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        return (int) assessorRepository.countByCompetitionIdAndSpecialization(
                performance.getCompetition().getId(),
                performance.getContentType() == Performance.ContentType.QUYEN ? 
                    Assessor.Specialization.QUYEN : 
                    performance.getContentType() == Performance.ContentType.MUSIC ? 
                        Assessor.Specialization.MUSIC : 
                        Assessor.Specialization.FIGHTING
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

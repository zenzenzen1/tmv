package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreatePerformanceRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.*;
import sep490g65.fvcapi.repository.*;
import sep490g65.fvcapi.service.PerformanceService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerformanceServiceImpl implements PerformanceService {

    private final PerformanceRepository performanceRepository;
    private final PerformanceAthleteRepository performanceAthleteRepository;
    private final AthleteRepository athleteRepository;
    private final CompetitionRepository competitionRepository;
    private final AssessorRepository assessorRepository;
    private final AssessorScoreRepository assessorScoreRepository;

    @Override
    @Transactional
    public PerformanceResponse createPerformance(CreatePerformanceRequest request) {
        // Validate competition exists
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        // Create performance
        Performance performance = Performance.builder()
                .competition(competition)
                .isTeam(request.getIsTeam())
                .teamId(request.getTeamId())
                .teamName(request.getTeamName())
                .performanceType(request.getPerformanceType())
                .contentType(request.getContentType())
                .contentId(request.getContentId())
                .status(Performance.PerformanceStatus.PENDING)
                .build();

        Performance savedPerformance = performanceRepository.save(performance);

        // Add athletes if provided
        if (request.getAthleteIds() != null && !request.getAthleteIds().isEmpty()) {
            for (int i = 0; i < request.getAthleteIds().size(); i++) {
                String athleteId = request.getAthleteIds().get(i);
                Integer teamPosition = request.getTeamPositions() != null && i < request.getTeamPositions().size() 
                    ? request.getTeamPositions().get(i) : i + 1;
                Boolean isCaptain = request.getIsCaptains() != null && i < request.getIsCaptains().size() 
                    ? request.getIsCaptains().get(i) : false;

                addAthleteToPerformance(savedPerformance.getId(), athleteId, teamPosition, isCaptain);
            }
        }

        return convertToResponse(savedPerformance);
    }

    @Override
    public PerformanceResponse getPerformanceById(String id) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        return convertToResponse(performance);
    }

    @Override
    public List<PerformanceResponse> getPerformancesByCompetitionId(String competitionId) {
        List<Performance> performances = performanceRepository.findByCompetitionId(competitionId);
        return performances.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceResponse> getPerformancesByCompetitionIdAndType(String competitionId, Performance.PerformanceType performanceType) {
        List<Performance> performances = performanceRepository.findByCompetitionIdAndPerformanceType(competitionId, performanceType);
        return performances.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceResponse> getPerformancesByCompetitionIdAndContentType(String competitionId, Performance.ContentType contentType) {
        List<Performance> performances = performanceRepository.findByCompetitionIdAndContentType(competitionId, contentType);
        return performances.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PerformanceResponse updatePerformanceStatus(String id, Performance.PerformanceStatus status) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        
        performance.setStatus(status);
        
        if (status == Performance.PerformanceStatus.IN_PROGRESS) {
            performance.setStartTime(LocalDateTime.now());
        } else if (status == Performance.PerformanceStatus.COMPLETED) {
            performance.setEndTime(LocalDateTime.now());
        }
        
        Performance savedPerformance = performanceRepository.save(performance);
        return convertToResponse(savedPerformance);
    }

    @Override
    @Transactional
    public PerformanceResponse startPerformance(String id) {
        return updatePerformanceStatus(id, Performance.PerformanceStatus.IN_PROGRESS);
    }

    @Override
    @Transactional
    public PerformanceResponse completePerformance(String id) {
        return updatePerformanceStatus(id, Performance.PerformanceStatus.COMPLETED);
    }

    @Override
    @Transactional
    public PerformanceResponse cancelPerformance(String id) {
        return updatePerformanceStatus(id, Performance.PerformanceStatus.CANCELLED);
    }

    @Override
    @Transactional
    public void deletePerformance(String id) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        performanceRepository.delete(performance);
    }

    @Override
    @Transactional
    public PerformanceResponse addAthleteToPerformance(String performanceId, String athleteId, Integer teamPosition, Boolean isCaptain) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        
        Athlete athlete = athleteRepository.findById(java.util.UUID.fromString(athleteId))
                .orElseThrow(() -> new RuntimeException("Athlete not found"));

        PerformanceAthlete performanceAthlete = PerformanceAthlete.builder()
                .performance(performance)
                .athlete(athlete)
                .teamPosition(teamPosition)
                .isCaptain(isCaptain)
                .build();

        performanceAthleteRepository.save(performanceAthlete);
        
        return convertToResponse(performance);
    }

    @Override
    @Transactional
    public void removeAthleteFromPerformance(String performanceId, String athleteId) {
        PerformanceAthlete performanceAthlete = performanceAthleteRepository
                .findByPerformanceIdAndAthleteId(performanceId, java.util.UUID.fromString(athleteId))
                .orElseThrow(() -> new RuntimeException("Athlete not found in performance"));
        
        performanceAthleteRepository.delete(performanceAthlete);
    }

    private PerformanceResponse convertToResponse(Performance performance) {
        // Get athletes
        List<PerformanceAthlete> performanceAthletes = performanceAthleteRepository
                .findByPerformanceIdOrderByTeamPosition(performance.getId());
        
        List<PerformanceResponse.AthleteInfo> athletes = performanceAthletes.stream()
                .map(pa -> PerformanceResponse.AthleteInfo.builder()
                        .id(pa.getAthlete().getId().toString())
                        .fullName(pa.getAthlete().getFullName())
                        .email(pa.getAthlete().getEmail())
                        .teamPosition(pa.getTeamPosition())
                        .isCaptain(pa.getIsCaptain())
                        .build())
                .collect(Collectors.toList());

        // Get assessors
        List<Assessor> assessors = assessorRepository.findByCompetitionIdAndSpecialization(
                performance.getCompetition().getId(), 
                performance.getContentType() == Performance.ContentType.QUYEN ? 
                    Assessor.Specialization.QUYEN : 
                    performance.getContentType() == Performance.ContentType.MUSIC ? 
                        Assessor.Specialization.MUSIC : 
                        Assessor.Specialization.FIGHTING
        );
        
        List<PerformanceResponse.AssessorInfo> assessorInfos = assessors.stream()
                .map(a -> PerformanceResponse.AssessorInfo.builder()
                        .id(a.getId())
                        .fullName(a.getUser().getFullName())
                        .email(a.getUser().getPersonalMail())
                        .specialization(a.getSpecialization())
                        .build())
                .collect(Collectors.toList());

        // Get scores
        List<AssessorScore> scores = assessorScoreRepository.findByPerformanceIdOrderBySubmittedAt(performance.getId());
        
        List<PerformanceResponse.ScoreInfo> scoreInfos = scores.stream()
                .map(s -> PerformanceResponse.ScoreInfo.builder()
                        .id(s.getId())
                        .assessorId(s.getAssessor().getId())
                        .assessorName(s.getAssessor().getUser().getFullName())
                        .score(s.getScore())
                        .criteriaScores(s.getCriteriaScores())
                        .notes(s.getNotes())
                        .submittedAt(s.getSubmittedAt())
                        .build())
                .collect(Collectors.toList());

        // Calculate average score
        java.math.BigDecimal averageScore = assessorScoreRepository.calculateAverageScoreByPerformanceId(performance.getId());
        if (averageScore == null) {
            averageScore = java.math.BigDecimal.ZERO;
        }

        int assessorCount = (int) assessorScoreRepository.countByPerformanceId(performance.getId());
        int remainingAssessors = assessors.size() - assessorCount;

        return PerformanceResponse.builder()
                .id(performance.getId())
                .competitionId(performance.getCompetition().getId())
                .competitionName(performance.getCompetition().getName())
                .isTeam(performance.getIsTeam())
                .teamId(performance.getTeamId())
                .teamName(performance.getTeamName())
                .performanceType(performance.getPerformanceType())
                .contentType(performance.getContentType())
                .contentId(performance.getContentId())
                .status(performance.getStatus())
                .startTime(performance.getStartTime())
                .endTime(performance.getEndTime())
                .totalScore(performance.getTotalScore())
                .athletes(athletes)
                .assessors(assessorInfos)
                .scores(scoreInfos)
                .averageScore(averageScore)
                .assessorCount(assessorCount)
                .remainingAssessors(remainingAssessors)
                .createdAt(performance.getCreatedAt())
                .updatedAt(performance.getUpdatedAt())
                .build();
    }
}

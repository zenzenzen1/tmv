package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreatePerformanceMatchRequest;
import sep490g65.fvcapi.dto.response.PerformanceMatchResponse;
import sep490g65.fvcapi.dto.request.SavePerformanceMatchSetupRequest;
import sep490g65.fvcapi.entity.Assessor;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.entity.PerformanceAthlete;
import sep490g65.fvcapi.entity.PerformanceMatch;
import sep490g65.fvcapi.repository.AssessorRepository;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.repository.PerformanceAthleteRepository;
import sep490g65.fvcapi.repository.PerformanceMatchRepository;
import sep490g65.fvcapi.repository.PerformanceRepository;
import sep490g65.fvcapi.service.PerformanceMatchService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PerformanceMatchServiceImpl implements PerformanceMatchService {

    private final PerformanceMatchRepository performanceMatchRepository;
    private final PerformanceRepository performanceRepository;
    private final CompetitionRepository competitionRepository;
    private final AssessorRepository assessorRepository;
    private final PerformanceAthleteRepository performanceAthleteRepository;

    private int getNextMatchOrder(String competitionId) {
        List<PerformanceMatch> existing = performanceMatchRepository.findByCompetitionIdOrderByMatchOrder(competitionId);
        if (existing == null || existing.isEmpty()) {
            return 1;
        }
        Integer max = existing.stream()
                .map(PerformanceMatch::getMatchOrder)
                .filter(o -> o != null)
                .max(Integer::compareTo)
                .orElse(0);
        return max + 1;
    }

    @Override
    @Transactional
    public PerformanceMatchResponse createPerformanceMatch(CreatePerformanceMatchRequest request) {
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        Performance performance = performanceRepository.findById(request.getPerformanceId())
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        // Check if PerformanceMatch already exists for this performance
        if (performanceMatchRepository.findByPerformanceId(request.getPerformanceId()).isPresent()) {
            throw new RuntimeException("PerformanceMatch already exists for this performance");
        }

        // Validate contentType matches performance contentType
        if (request.getContentType() != null && request.getContentType() != performance.getContentType()) {
            throw new RuntimeException("ContentType mismatch with performance");
        }

        Integer order = request.getMatchOrder();
        if (order == null) {
            order = getNextMatchOrder(competition.getId());
        }

        PerformanceMatch performanceMatch = PerformanceMatch.builder()
                .competition(competition)
                .performance(performance)
                .matchOrder(order)
                .scheduledTime(request.getScheduledTime())
                .contentType(request.getContentType() != null ? request.getContentType() : performance.getContentType())
                .status(PerformanceMatch.MatchStatus.PENDING)
                .notes(request.getNotes())
                .build();

        PerformanceMatch saved = performanceMatchRepository.save(performanceMatch);
        log.info("Created PerformanceMatch {} for performance {}", saved.getId(), performance.getId());

        List<PerformanceAthlete> athletes = performanceAthleteRepository.findByPerformanceId(performance.getId());
        return PerformanceMatchResponse.from(saved, athletes);
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceMatchResponse getPerformanceMatchById(String id) {
        PerformanceMatch performanceMatch = performanceMatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PerformanceMatch not found"));
        List<PerformanceAthlete> athletes = performanceAthleteRepository.findByPerformanceId(performanceMatch.getPerformance().getId());
        return PerformanceMatchResponse.from(performanceMatch, athletes);
    }

    @Override
    @Transactional(readOnly = true)
    public PerformanceMatchResponse getPerformanceMatchByPerformanceId(String performanceId) {
        PerformanceMatch performanceMatch = performanceMatchRepository.findByPerformanceId(performanceId)
                .orElseThrow(() -> new RuntimeException("PerformanceMatch not found for performance: " + performanceId));
        List<PerformanceAthlete> athletes = performanceAthleteRepository.findByPerformanceId(performanceId);
        return PerformanceMatchResponse.from(performanceMatch, athletes);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceMatchResponse> getPerformanceMatchesByCompetitionId(String competitionId) {
        List<PerformanceMatch> matches = performanceMatchRepository.findByCompetitionId(competitionId);
        return matches.stream()
                .map(pm -> PerformanceMatchResponse.from(pm,
                        performanceAthleteRepository.findByPerformanceId(pm.getPerformance().getId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PerformanceMatchResponse updatePerformanceMatchStatus(String id, PerformanceMatch.MatchStatus status) {
        PerformanceMatch performanceMatch = performanceMatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PerformanceMatch not found"));

        performanceMatch.setStatus(status);
        
        // Update actual times based on status
        if (status == PerformanceMatch.MatchStatus.IN_PROGRESS && performanceMatch.getActualStartTime() == null) {
            performanceMatch.setActualStartTime(java.time.LocalDateTime.now());
        } else if (status == PerformanceMatch.MatchStatus.COMPLETED && performanceMatch.getActualEndTime() == null) {
            performanceMatch.setActualEndTime(java.time.LocalDateTime.now());
        }

        PerformanceMatch saved = performanceMatchRepository.save(performanceMatch);
        List<PerformanceAthlete> athletes = performanceAthleteRepository.findByPerformanceId(saved.getPerformance().getId());
        return PerformanceMatchResponse.from(saved, athletes);
    }

    @Override
    @Transactional
    public PerformanceMatchResponse updatePerformanceMatch(String id, CreatePerformanceMatchRequest request) {
        PerformanceMatch performanceMatch = performanceMatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PerformanceMatch not found"));

        if (request.getMatchOrder() != null) {
            performanceMatch.setMatchOrder(request.getMatchOrder());
        }
        if (request.getScheduledTime() != null) {
            performanceMatch.setScheduledTime(request.getScheduledTime());
        }
        if (request.getNotes() != null) {
            performanceMatch.setNotes(request.getNotes());
        }

        PerformanceMatch saved = performanceMatchRepository.save(performanceMatch);
        List<PerformanceAthlete> athletes = performanceAthleteRepository.findByPerformanceId(saved.getPerformance().getId());
        return PerformanceMatchResponse.from(saved, athletes);
    }

    @Override
    @Transactional
    public void deletePerformanceMatch(String id) {
        PerformanceMatch performanceMatch = performanceMatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PerformanceMatch not found"));
        performanceMatchRepository.delete(performanceMatch);
        log.info("Deleted PerformanceMatch: {}", id);
    }

    @Override
    @Transactional
    public PerformanceMatchResponse savePerformanceMatchSetup(String performanceId, SavePerformanceMatchSetupRequest options) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        // Only allow for quyền/võ nhạc
        if (performance.getContentType() != Performance.ContentType.QUYEN 
                && performance.getContentType() != Performance.ContentType.MUSIC) {
            throw new RuntimeException("PerformanceMatch can only be created for QUYEN or MUSIC performances");
        }

        // Create or get existing PerformanceMatch
        PerformanceMatch performanceMatch = performanceMatchRepository.findByPerformanceId(performanceId)
                .orElseGet(() -> {
                    Integer order = getNextMatchOrder(performance.getCompetition().getId());
                    PerformanceMatch newMatch = PerformanceMatch.builder()
                            .competition(performance.getCompetition())
                            .performance(performance)
                            .matchOrder(order)
                            .contentType(performance.getContentType())
                            .status(PerformanceMatch.MatchStatus.PENDING)
                            .build();
                    return performanceMatchRepository.save(newMatch);
                });

        // Denormalize filter fields from Performance
        // Allow explicit override from request body if provided; otherwise fall back to Performance
        if (options != null) {
            if (options.getFistConfigId() != null && !options.getFistConfigId().isEmpty()) {
                performanceMatch.setFistConfigId(options.getFistConfigId());
            } else {
                performanceMatch.setFistConfigId(performance.getFistConfigId());
            }
            if (options.getFistItemId() != null && !options.getFistItemId().isEmpty()) {
                performanceMatch.setFistItemId(options.getFistItemId());
            } else {
                performanceMatch.setFistItemId(performance.getFistItemId());
            }
            if (options.getMusicContentId() != null && !options.getMusicContentId().isEmpty()) {
                performanceMatch.setMusicContentId(options.getMusicContentId());
            } else {
                performanceMatch.setMusicContentId(performance.getMusicContentId());
            }
        } else {
            performanceMatch.setFistConfigId(performance.getFistConfigId());
            performanceMatch.setFistItemId(performance.getFistItemId());
            performanceMatch.setMusicContentId(performance.getMusicContentId());
        }

        // Apply optional scheduled time and duration
        if (options != null) {
            if (options.getScheduledTime() != null) {
                performanceMatch.setScheduledTime(options.getScheduledTime());
            }
            if (options.getDurationSeconds() != null) {
                performanceMatch.setDurationSeconds(options.getDurationSeconds());
            }
        }

        // Link all assessors assigned to this performance with the PerformanceMatch
        List<Assessor> assessors = assessorRepository.findByPerformanceId(performanceId);
        for (Assessor assessor : assessors) {
            if (assessor.getPerformanceMatch() == null) {
                assessor.setPerformanceMatch(performanceMatch);
                assessorRepository.save(assessor);
                log.info("Linked assessor {} to PerformanceMatch {}", assessor.getId(), performanceMatch.getId());
            }
        }

        // Validate athlete selection according to FE rule (only 1 individual OR one team)
        List<PerformanceAthlete> athletes = performanceAthleteRepository.findByPerformanceId(performanceId);
        if (Boolean.FALSE.equals(performance.getIsTeam())) {
            if (athletes.size() != 1) {
                throw new RuntimeException("Individual performance must have exactly 1 athlete selected");
            }
        } else { // team
            if (athletes.isEmpty()) {
                throw new RuntimeException("Team performance must have at least 1 athlete in the team");
            }
        }

        // Update status to READY if has athletes and assessors
        int athleteCount = athletes.size();
        if (athleteCount > 0 && !assessors.isEmpty()) {
            performanceMatch.setStatus(PerformanceMatch.MatchStatus.READY);
        }
        performanceMatch = performanceMatchRepository.save(performanceMatch);

        log.info("Saved PerformanceMatch setup for performance {}: {} athletes, {} assessors", 
                performanceId, athleteCount, assessors.size());
        
        return PerformanceMatchResponse.from(performanceMatch, athletes);
    }
}


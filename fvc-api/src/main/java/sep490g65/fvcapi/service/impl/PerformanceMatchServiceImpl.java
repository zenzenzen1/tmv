package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreatePerformanceMatchRequest;
import sep490g65.fvcapi.dto.response.PerformanceMatchResponse;
import sep490g65.fvcapi.dto.request.SavePerformanceMatchSetupRequest;
import sep490g65.fvcapi.dto.response.AssessorResponse;
import sep490g65.fvcapi.entity.Assessor;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.Field;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.entity.PerformanceAthlete;
import sep490g65.fvcapi.entity.PerformanceMatch;
import sep490g65.fvcapi.repository.AssessorRepository;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.repository.FieldRepository;
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
    private final FieldRepository fieldRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
        Performance performance = performanceMatch.getPerformance();
        List<PerformanceAthlete> athletes;
        if (performance != null) {
            athletes = performanceAthleteRepository.findByPerformanceId(performance.getId());
        } else {
            athletes = new java.util.ArrayList<>(); // Empty list for matches without performance
        }
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
                .map(pm -> {
                    Performance perf = pm.getPerformance();
                    List<PerformanceAthlete> athletes;
                    if (perf != null) {
                        athletes = performanceAthleteRepository.findByPerformanceId(perf.getId());
                    } else {
                        athletes = new java.util.ArrayList<>(); // Empty list for matches without performance
                    }
                    return PerformanceMatchResponse.from(pm, athletes);
                })
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
        
        // Always broadcast PerformanceMatch status change (for realtime updates)
        try {
            java.util.Map<String, Object> matchPayload = new java.util.HashMap<>();
            matchPayload.put("type", "STATUS_CHANGED");
            matchPayload.put("matchId", saved.getId());
            matchPayload.put("status", saved.getStatus().toString());
            matchPayload.put("startTime", saved.getActualStartTime());
            matchPayload.put("endTime", saved.getActualEndTime());
            // Broadcast to PerformanceMatch topic
            messagingTemplate.convertAndSend("/topic/performance-match/" + saved.getId() + "/status", matchPayload);
        } catch (Exception ignored) {}
        
        // Sync Performance status from PerformanceMatch (PerformanceMatch mirrors Performance status)
        Performance performance = saved.getPerformance();
        if (performance != null) {
            if (status == PerformanceMatch.MatchStatus.READY) {
                // READY means match is setup but not started yet
                // Sync Performance status to PENDING (not started)
                if (performance.getStatus() != Performance.PerformanceStatus.PENDING) {
                    performance.setStatus(Performance.PerformanceStatus.PENDING);
                    performanceRepository.save(performance);
                    log.info("Synced Performance {} status to PENDING because PerformanceMatch {} is READY", 
                        performance.getId(), saved.getId());
                }
            } else {
                // For other statuses (PENDING, IN_PROGRESS, COMPLETED, CANCELLED), sync normally
                Performance.PerformanceStatus perfStatus = mapMatchStatusToPerformanceStatus(status);
                if (perfStatus != null && performance.getStatus() != perfStatus) {
                    performance.setStatus(perfStatus);
                    if (status == PerformanceMatch.MatchStatus.IN_PROGRESS) {
                        performance.setStartTime(java.time.LocalDateTime.now());
                    } else if (status == PerformanceMatch.MatchStatus.COMPLETED) {
                        performance.setEndTime(java.time.LocalDateTime.now());
                    }
                    performanceRepository.save(performance);
                }
            }
            
            // Always broadcast Performance status change (even if status didn't change, for realtime sync)
            try {
                java.util.Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("type", "STATUS_CHANGED");
                payload.put("performanceId", performance.getId());
                payload.put("status", performance.getStatus() != null ? performance.getStatus().toString() : "UNKNOWN");
                payload.put("startTime", performance.getStartTime());
                payload.put("endTime", performance.getEndTime());
                payload.put("matchId", saved.getId()); // Include matchId for reference
                messagingTemplate.convertAndSend("/topic/performance/" + performance.getId() + "/status", payload);
            } catch (Exception ignored) {}
        }
        
        // Handle cases where PerformanceMatch might not have a Performance (e.g., preset matches)
        List<PerformanceAthlete> athletes;
        if (performance != null) {
            athletes = performanceAthleteRepository.findByPerformanceId(performance.getId());
        } else {
            athletes = new java.util.ArrayList<>(); // Empty list for matches without performance
        }
        return PerformanceMatchResponse.from(saved, athletes);
    }

    private Performance.PerformanceStatus mapMatchStatusToPerformanceStatus(PerformanceMatch.MatchStatus matchStatus) {
        return switch (matchStatus) {
            case PENDING -> Performance.PerformanceStatus.PENDING;
            case READY -> Performance.PerformanceStatus.PENDING; // READY maps to PENDING in Performance
            case IN_PROGRESS -> Performance.PerformanceStatus.IN_PROGRESS;
            case COMPLETED -> Performance.PerformanceStatus.COMPLETED;
            case CANCELLED -> Performance.PerformanceStatus.CANCELLED;
        };
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
        Performance performance = saved.getPerformance();
        List<PerformanceAthlete> athletes;
        if (performance != null) {
            athletes = performanceAthleteRepository.findByPerformanceId(performance.getId());
        } else {
            athletes = new java.util.ArrayList<>(); // Empty list for matches without performance
        }
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

            if (options.getFieldId() != null) {
                if (!options.getFieldId().isBlank()) {
                    Field field = fieldRepository.findById(options.getFieldId())
                            .orElseThrow(() -> new RuntimeException("Field not found: " + options.getFieldId()));
                    performanceMatch.setFieldId(field.getId());
                    performanceMatch.setFieldLocation(field.getLocation());
                } else {
                    performanceMatch.setFieldId(null);
                    performanceMatch.setFieldLocation(null);
                }
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
            // Use updatePerformanceMatchStatus to trigger sync with Performance
            // This ensures Performance status is synced to PENDING when PerformanceMatch becomes READY
            updatePerformanceMatchStatus(performanceMatch.getId(), PerformanceMatch.MatchStatus.READY);
            // Reload to get updated entity
            performanceMatch = performanceMatchRepository.findById(performanceMatch.getId())
                    .orElseThrow(() -> new RuntimeException("PerformanceMatch not found after status update"));
        } else {
            performanceMatch = performanceMatchRepository.save(performanceMatch);
        }

        log.info("Saved PerformanceMatch setup for performance {}: {} athletes, {} assessors", 
                performanceId, athleteCount, assessors.size());
        
        return PerformanceMatchResponse.from(performanceMatch, athletes);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssessorResponse> getAssessorsByPerformanceMatchId(String performanceMatchId) {
        List<Assessor> assessors = assessorRepository.findByPerformanceMatchId(performanceMatchId);
        return assessors.stream()
                .map(AssessorResponse::from)
                .collect(Collectors.toList());
    }
}


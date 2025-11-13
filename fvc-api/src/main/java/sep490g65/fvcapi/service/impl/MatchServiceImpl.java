package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.ControlMatchRequest;
import sep490g65.fvcapi.dto.request.CreateMatchRequest;
import sep490g65.fvcapi.dto.request.RecordScoreEventRequest;
import sep490g65.fvcapi.dto.response.MatchAthleteInfoDto;
import sep490g65.fvcapi.dto.response.MatchEventDto;
import sep490g65.fvcapi.dto.response.MatchListItemDto;
import sep490g65.fvcapi.dto.response.MatchRoundDto;
import sep490g65.fvcapi.dto.response.MatchScoreboardDto;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.entity.Match;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.entity.MatchEvent;
import sep490g65.fvcapi.entity.MatchRound;
import sep490g65.fvcapi.enums.RoundType;
import sep490g65.fvcapi.entity.MatchScoreboardSnapshot;
import sep490g65.fvcapi.enums.*;
import sep490g65.fvcapi.config.WebSocketConnectionEventListener.AssessorConnectionStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.AthleteRepository;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.repository.MatchAssessorRepository;
import sep490g65.fvcapi.repository.MatchEventRepository;
import sep490g65.fvcapi.repository.MatchRepository;
import sep490g65.fvcapi.repository.MatchRoundRepository;
import sep490g65.fvcapi.repository.MatchScoreboardSnapshotRepository;
import sep490g65.fvcapi.repository.WeightClassRepository;
import sep490g65.fvcapi.repository.FieldRepository;
import sep490g65.fvcapi.service.MatchService;
import sep490g65.fvcapi.config.WebSocketConnectionEventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final MatchEventRepository matchEventRepository;
    private final MatchScoreboardSnapshotRepository scoreboardSnapshotRepository;
    private final MatchAssessorRepository matchAssessorRepository;
    private final MatchRoundRepository matchRoundRepository;
    private final WeightClassRepository weightClassRepository;
    private final FieldRepository fieldRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AthleteRepository athleteRepository;
    private final CompetitionRepository competitionRepository;
    private final WebSocketConnectionEventListener webSocketConnectionEventListener;
    private final sep490g65.fvcapi.service.AthleteService athleteService;

    @Override
    @Transactional
    public MatchScoreboardDto createMatch(CreateMatchRequest request, String userId) {
        log.info("Creating match for competition: {}, red athlete: {}, blue athlete: {}", 
                request.getCompetitionId(), request.getRedAthleteId(), request.getBlueAthleteId());

        // Validate competition exists
        competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Competition not found: %s", request.getCompetitionId())));

        // Get athletes
        Athlete redAthlete = athleteRepository.findById(UUID.fromString(request.getRedAthleteId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Red athlete not found: %s", request.getRedAthleteId())));
        
        Athlete blueAthlete = athleteRepository.findById(UUID.fromString(request.getBlueAthleteId()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Blue athlete not found: %s", request.getBlueAthleteId())));

        // Create match
        Match match = Match.builder()
                .competitionId(request.getCompetitionId())
                .weightClassId(request.getWeightClassId())
                .fieldId(request.getFieldId())
                .roundType(request.getRoundType())
                .redAthleteId(request.getRedAthleteId())
                .blueAthleteId(request.getBlueAthleteId())
                .redAthleteName(redAthlete.getFullName())
                .blueAthleteName(blueAthlete.getFullName())
                .redAthleteUnit(request.getRedAthleteUnit() != null ? request.getRedAthleteUnit() : redAthlete.getClub())
                .blueAthleteUnit(request.getBlueAthleteUnit() != null ? request.getBlueAthleteUnit() : blueAthlete.getClub())
                .redAthleteSbtNumber(request.getRedAthleteSbtNumber())
                .blueAthleteSbtNumber(request.getBlueAthleteSbtNumber())
                .status(MatchStatus.PENDING)
                .currentRound(1)
                .totalRounds(request.getTotalRounds() != null ? request.getTotalRounds() : 3)
                .roundDurationSeconds(request.getRoundDurationSeconds() != null ? request.getRoundDurationSeconds() : 120) // Keep for backward compatibility
                .mainRoundDurationSeconds(request.getRoundDurationSeconds() != null ? request.getRoundDurationSeconds() : 120) // Default main round duration
                .tiebreakerDurationSeconds(60) // Default tiebreaker duration
                .createdBy(userId)
                .build();

        match = matchRepository.save(match);
        log.info("Match created successfully with ID: {}", match.getId());

        // Create rounds for the match
        createRoundsForMatch(match);

        // Create initial snapshot
        createInitialSnapshot(match);

        // Return scoreboard
        return getScoreboard(match.getId());
    }

    @Override
    @Transactional
    public List<MatchScoreboardDto> bulkCreateMatches(List<CreateMatchRequest> requests, String userId) {
        log.info("Bulk creating {} matches", requests.size());
        
        List<MatchScoreboardDto> createdMatches = new java.util.ArrayList<>();
        java.util.Set<String> athleteIds = new java.util.HashSet<>();
        
        for (CreateMatchRequest request : requests) {
            try {
                MatchScoreboardDto match = createMatch(request, userId);
                createdMatches.add(match);
                log.debug("Created match: {}", match.getMatchId());
                
                // Collect athlete IDs for status update
                if (request.getRedAthleteId() != null) {
                    athleteIds.add(request.getRedAthleteId());
                }
                if (request.getBlueAthleteId() != null) {
                    athleteIds.add(request.getBlueAthleteId());
                }
            } catch (Exception e) {
                log.error("Error creating match for red athlete: {}, blue athlete: {}", 
                        request.getRedAthleteId(), request.getBlueAthleteId(), e);
                // Continue with other matches even if one fails
            }
        }
        
        // Update athlete status to DONE for all athletes who participated in matches
        if (!athleteIds.isEmpty()) {
            try {
                athleteService.updateAthletesStatus(
                    new java.util.ArrayList<>(athleteIds), 
                    Athlete.AthleteStatus.DONE
                );
                log.info("Updated {} athletes status to DONE after creating matches", athleteIds.size());
            } catch (Exception e) {
                log.error("Error updating athlete statuses after bulk create matches", e);
                // Don't fail the entire operation if status update fails
            }
        }
        
        log.info("Bulk create completed. Successfully created {} out of {} matches", 
                createdMatches.size(), requests.size());
        
        return createdMatches;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchListItemDto> listMatches(String competitionId, String status) {
        log.info("Listing matches - competitionId: {}, status: {}", competitionId, status);
        
        List<Match> matches;
        
        if (competitionId != null && !competitionId.trim().isEmpty()) {
            if (status != null && !status.trim().isEmpty()) {
                try {
                    MatchStatus statusEnum = MatchStatus.valueOf(status.toUpperCase());
                    matches = matchRepository.findByCompetitionIdAndDeletedAtIsNull(competitionId).stream()
                            .filter(m -> m.getStatus() == statusEnum)
                            .collect(java.util.stream.Collectors.toList());
                } catch (IllegalArgumentException e) {
                    matches = matchRepository.findByCompetitionIdAndDeletedAtIsNull(competitionId);
                }
            } else {
                matches = matchRepository.findByCompetitionIdAndDeletedAtIsNull(competitionId);
            }
        } else if (status != null && !status.trim().isEmpty()) {
            try {
                MatchStatus statusEnum = MatchStatus.valueOf(status.toUpperCase());
                matches = matchRepository.findByStatusAndDeletedAtIsNull(statusEnum);
            } catch (IllegalArgumentException e) {
                matches = matchRepository.findAll().stream()
                        .filter(m -> m.getDeletedAt() == null)
                        .collect(java.util.stream.Collectors.toList());
            }
        } else {
            matches = matchRepository.findAll().stream()
                    .filter(m -> m.getDeletedAt() == null)
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // Sort by createdAt descending (newest first)
        matches.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        
        return matches.stream().map(this::toMatchListItemDto).collect(java.util.stream.Collectors.toList());
    }
    
    private MatchListItemDto toMatchListItemDto(Match match) {
        return MatchListItemDto.builder()
                .id(match.getId())
                .competitionId(match.getCompetitionId())
                .weightClassId(match.getWeightClassId())
                .roundType(match.getRoundType())
                .redAthleteId(match.getRedAthleteId())
                .blueAthleteId(match.getBlueAthleteId())
                .redAthleteName(match.getRedAthleteName())
                .blueAthleteName(match.getBlueAthleteName())
                .redAthleteUnit(match.getRedAthleteUnit())
                .blueAthleteUnit(match.getBlueAthleteUnit())
                .status(getStatusText(match.getStatus()))
                .currentRound(match.getCurrentRound())
                .totalRounds(match.getTotalRounds())
                .createdAt(match.getCreatedAt())
                .scheduledStartTime(match.getScheduledStartTime())
                .startedAt(match.getStartedAt())
                .endedAt(match.getEndedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public MatchScoreboardDto getScoreboard(String matchId) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        MatchScoreboardSnapshot snapshot = scoreboardSnapshotRepository.findByMatchId(matchId)
                .orElseGet(() -> createInitialSnapshot(match));

        String statusText = getStatusText(match.getStatus());

        // Get weight class name instead of ID
        String weightClassName = null;
        if (match.getWeightClassId() != null && !match.getWeightClassId().isEmpty()) {
            weightClassName = weightClassRepository.findById(match.getWeightClassId())
                    .map(wc -> wc.getWeightClass())
                    .orElse(null);
        }

        // Get field location instead of ID
        String fieldLocation = null;
        if (match.getFieldId() != null && !match.getFieldId().isEmpty()) {
            fieldLocation = fieldRepository.findById(match.getFieldId())
                    .map(f -> f.getLocation())
                    .orElse(null);
        }

        // Get duration for current round (main round or tiebreaker)
        Integer currentRoundDuration;
        if (match.getCurrentRound() <= 2) {
            currentRoundDuration = match.getMainRoundDurationSeconds();
        } else {
            currentRoundDuration = match.getTiebreakerDurationSeconds();
        }
        
        // Try to get from MatchRound if exists
        final Integer[] finalDuration = {currentRoundDuration};
        matchRoundRepository.findByMatchIdAndRoundNumber(match.getId(), match.getCurrentRound())
                .ifPresent(round -> {
                    if (round.getScheduledDurationSeconds() != null) {
                        finalDuration[0] = round.getScheduledDurationSeconds();
                    }
                });
        currentRoundDuration = finalDuration[0];

        return MatchScoreboardDto.builder()
                .matchId(match.getId())
                .matchName(buildMatchName(match))
                .weightClass(weightClassName)
                .field(fieldLocation)
                .roundType(match.getRoundType())
                .currentRound(match.getCurrentRound())
                .totalRounds(match.getTotalRounds())
                .roundDurationSeconds(currentRoundDuration)
                .mainRoundDurationSeconds(match.getMainRoundDurationSeconds())
                .tiebreakerDurationSeconds(match.getTiebreakerDurationSeconds())
                .status(statusText)
                .scheduledStartTime(match.getScheduledStartTime() != null 
                        ? match.getScheduledStartTime().toString() 
                        : null)
                .redAthletePresent(match.getRedAthletePresent())
                .blueAthletePresent(match.getBlueAthletePresent())
                .redAthlete(MatchAthleteInfoDto.builder()
                        .id(match.getRedAthleteId())
                        .name(match.getRedAthleteName())
                        .unit(match.getRedAthleteUnit())
                        .sbtNumber(match.getRedAthleteSbtNumber())
                        .score(snapshot.getRedScore())
                        .medicalTimeoutCount(snapshot.getRedMedicalTimeoutCount())
                        .warningCount(snapshot.getRedWarningCount())
                        .build())
                .blueAthlete(MatchAthleteInfoDto.builder()
                        .id(match.getBlueAthleteId())
                        .name(match.getBlueAthleteName())
                        .unit(match.getBlueAthleteUnit())
                        .sbtNumber(match.getBlueAthleteSbtNumber())
                        .score(snapshot.getBlueScore())
                        .medicalTimeoutCount(snapshot.getBlueMedicalTimeoutCount())
                        .warningCount(snapshot.getBlueWarningCount())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchEventDto> getEventHistory(String matchId) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        List<MatchEvent> events = matchEventRepository.findByMatchIdOrderByCreatedAtAsc(matchId);

        return events.stream()
                .map(this::toEventDto)
                .collect(Collectors.toList());
    }

    @Override
    public void recordScoreEvent(RecordScoreEventRequest request) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(request.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, request.getMatchId())));

        // Validate match status
        if (match.getStatus() != MatchStatus.IN_PROGRESS && match.getStatus() != MatchStatus.PAUSED) {
            throw new BusinessException(
                    MessageConstants.MATCH_NOT_IN_PROGRESS,
                    ErrorCode.MATCH_NOT_IN_PROGRESS.getCode());
        }

        // Create event
        MatchEvent event = MatchEvent.builder()
                .match(match)
                .round(request.getRound())
                .timestampInRoundSeconds(request.getTimestampInRoundSeconds())
                .judgeId(request.getJudgeId())
                .assessorIds(request.getAssessorIds()) // Store all assessor IDs who agreed
                .corner(request.getCorner())
                .eventType(request.getEventType())
                .description(buildEventDescription(request))
                .build();

        matchEventRepository.save(event);

        // Update scoreboard snapshot
        updateScoreboardSnapshot(match, event);

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(match.getId());

        log.info("Score event recorded for match {}: {} {} for {}", 
                match.getId(), request.getEventType(), request.getCorner(), request.getRound());
    }

    @Override
    public void controlMatch(ControlMatchRequest request) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(request.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, request.getMatchId())));

        switch (request.getAction()) {
            case START:
                if (match.getStatus() != MatchStatus.PENDING && match.getStatus() != MatchStatus.PAUSED) {
                    throw new BusinessException(
                            MessageConstants.INVALID_MATCH_STATUS,
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                // Validate assessors before starting match
                List<MatchAssessor> allAssessors = matchAssessorRepository.findByMatchId(match.getId());
                long assessorCount = allAssessors.size();
                
                // Check if we have exactly 6 assessors (5 ASSESSOR + 1 JUDGER)
                if (assessorCount != 6) {
                    throw new BusinessException(
                            "Trận đấu cần đúng 6 người (5 giám định + 1 trọng tài) trước khi bắt đầu. Hiện tại có " + assessorCount + " người.",
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                // Check if we have exactly 1 JUDGER (position 6)
                long judgerCount = allAssessors.stream()
                        .filter(a -> a.getRole() == AssessorRole.JUDGER || a.getPosition() == 6)
                        .count();
                if (judgerCount != 1) {
                    throw new BusinessException(
                            "Trận đấu cần đúng 1 trọng tài (vị trí 6). Hiện tại có " + judgerCount + " trọng tài.",
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                // Check if we have exactly 5 ASSESSORs (positions 1-5)
                long assessorRoleCount = allAssessors.stream()
                        .filter(a -> a.getRole() == AssessorRole.ASSESSOR && a.getPosition() >= 1 && a.getPosition() <= 5)
                        .count();
                if (assessorRoleCount != 5) {
                    throw new BusinessException(
                            "Trận đấu cần đúng 5 giám định (vị trí 1-5). Hiện tại có " + assessorRoleCount + " giám định.",
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                // Check if all 6 assessors are connected
                AssessorConnectionStatus connectionStatus = webSocketConnectionEventListener.getConnectionStatus(match.getId());
                int connectedCount = connectionStatus.getConnectedCount();
                List<String> connectedAssessorIds = connectionStatus.getConnectedAssessors();
                
                // Get all assessor IDs
                List<String> allAssessorIds = allAssessors.stream()
                        .map(a -> a.getId())
                        .collect(java.util.stream.Collectors.toList());
                
                // Check if all assessors are connected
                if (connectedCount < 6) {
                    List<String> missingAssessorIds = allAssessorIds.stream()
                            .filter(id -> !connectedAssessorIds.contains(id))
                            .collect(java.util.stream.Collectors.toList());
                    throw new BusinessException(
                            "Tất cả 6 người (5 giám định + 1 trọng tài) phải kết nối trước khi bắt đầu trận đấu. " +
                            "Hiện tại có " + connectedCount + "/6 người đã kết nối. " +
                            "Thiếu: " + missingAssessorIds.size() + " người.",
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                // Validate scheduled start time
                if (match.getScheduledStartTime() != null) {
                    LocalDateTime now = LocalDateTime.now();
                    if (now.isBefore(match.getScheduledStartTime())) {
                        throw new BusinessException(
                                String.format("Chưa đến giờ bắt đầu trận đấu. Giờ bắt đầu: %s. Còn %d phút nữa.",
                                        match.getScheduledStartTime().toString(),
                                        java.time.Duration.between(now, match.getScheduledStartTime()).toMinutes()),
                                ErrorCode.INVALID_MATCH_STATUS.getCode());
                    }
                }
                
                // Validate both athletes are present
                if (match.getRedAthletePresent() == null || !match.getRedAthletePresent()) {
                    throw new BusinessException(
                            String.format("Vui lòng xác nhận vận động viên đỏ (%s) đã có mặt trước khi bắt đầu trận đấu.",
                                    match.getRedAthleteName()),
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                if (match.getBlueAthletePresent() == null || !match.getBlueAthletePresent()) {
                    throw new BusinessException(
                            String.format("Vui lòng xác nhận vận động viên xanh (%s) đã có mặt trước khi bắt đầu trận đấu.",
                                    match.getBlueAthleteName()),
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                match.setStatus(MatchStatus.IN_PROGRESS);
                if (match.getStartedAt() == null) {
                    match.setStartedAt(LocalDateTime.now());
                }
                if (request.getCurrentRound() != null) {
                    match.setCurrentRound(request.getCurrentRound());
                }
                
                // Start the first round
                matchRoundRepository.findByMatchIdAndRoundNumber(match.getId(), match.getCurrentRound())
                        .ifPresent(round -> {
                            round.setStatus(MatchStatus.IN_PROGRESS);
                            round.setStartedAt(LocalDateTime.now());
                            matchRoundRepository.save(round);
                        });
                break;

            case PAUSE:
                if (match.getStatus() != MatchStatus.IN_PROGRESS) {
                    throw new BusinessException(
                            MessageConstants.INVALID_MATCH_STATUS,
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                match.setStatus(MatchStatus.PAUSED);
                
                // Pause current round
                matchRoundRepository.findByMatchIdAndRoundNumber(match.getId(), match.getCurrentRound())
                        .ifPresent(round -> {
                            round.setStatus(MatchStatus.PAUSED);
                            matchRoundRepository.save(round);
                        });
                break;

            case RESUME:
                if (match.getStatus() != MatchStatus.PAUSED) {
                    throw new BusinessException(
                            MessageConstants.INVALID_MATCH_STATUS,
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                match.setStatus(MatchStatus.IN_PROGRESS);
                
                // Resume current round
                matchRoundRepository.findByMatchIdAndRoundNumber(match.getId(), match.getCurrentRound())
                        .ifPresent(round -> {
                            round.setStatus(MatchStatus.IN_PROGRESS);
                            matchRoundRepository.save(round);
                        });
                break;

            case NEXT_ROUND:
                if (match.getStatus() != MatchStatus.IN_PROGRESS && match.getStatus() != MatchStatus.PAUSED) {
                    throw new BusinessException(
                            MessageConstants.INVALID_MATCH_STATUS,
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                // End current round
                matchRoundRepository.findByMatchIdAndRoundNumber(match.getId(), match.getCurrentRound())
                        .ifPresent(currentRound -> {
                            currentRound.setStatus(MatchStatus.ENDED);
                            currentRound.setEndedAt(LocalDateTime.now());
                            // Calculate duration
                            if (currentRound.getStartedAt() != null) {
                                long durationSeconds = java.time.Duration.between(
                                        currentRound.getStartedAt(), LocalDateTime.now()).getSeconds();
                                currentRound.setDurationSeconds((int) durationSeconds);
                            }
                            // Get current scores from snapshot
                            MatchScoreboardSnapshot snapshot = scoreboardSnapshotRepository.findByMatchId(match.getId())
                                    .orElse(null);
                            if (snapshot != null) {
                                currentRound.setRedScore(snapshot.getRedScore());
                                currentRound.setBlueScore(snapshot.getBlueScore());
                            }
                            matchRoundRepository.save(currentRound);
                        });
                
                if (match.getCurrentRound() >= match.getTotalRounds()) {
                    // Last round ended, end the match
                    match.setStatus(MatchStatus.ENDED);
                    match.setEndedAt(LocalDateTime.now());
                    
                    // Get final scores for notification
                    MatchScoreboardDto finalScoreboard = getScoreboard(match.getId());
                    String redScore = String.valueOf(finalScoreboard.getRedAthlete().getScore());
                    String blueScore = String.valueOf(finalScoreboard.getBlueAthlete().getScore());
                    String winner;
                    Corner winnerCorner = null;
                    if (finalScoreboard.getRedAthlete().getScore() > finalScoreboard.getBlueAthlete().getScore()) {
                        winner = "ĐỎ";
                        winnerCorner = Corner.RED;
                    } else if (finalScoreboard.getBlueAthlete().getScore() > finalScoreboard.getRedAthlete().getScore()) {
                        winner = "XANH";
                        winnerCorner = Corner.BLUE;
                    } else {
                        winner = "HÒA";
                        // winnerCorner remains null for tie
                    }
                    
                    // Set winner corner in match
                    match.setWinnerCorner(winnerCorner);
                    matchRepository.save(match);
                    
                    // Notify all assessors and disconnect them
                    webSocketConnectionEventListener.notifyMatchEndedAndDisconnect(
                            match.getId(), redScore, blueScore, winner);
                } else {
                    // Move to next round
                    int nextRound = match.getCurrentRound() + 1;
                    match.setCurrentRound(nextRound);
                    match.setStatus(MatchStatus.IN_PROGRESS);
                    
                    // Start next round
                    matchRoundRepository.findByMatchIdAndRoundNumber(match.getId(), nextRound)
                            .ifPresent(nextRoundEntity -> {
                                nextRoundEntity.setStatus(MatchStatus.IN_PROGRESS);
                                nextRoundEntity.setStartedAt(LocalDateTime.now());
                                matchRoundRepository.save(nextRoundEntity);
                            });
                    
                    log.info("Match {} moved to round {}", match.getId(), nextRound);
                }
                break;

            case END:
                if (match.getStatus() == MatchStatus.ENDED) {
                    throw new BusinessException(
                            MessageConstants.MATCH_ALREADY_ENDED,
                            ErrorCode.MATCH_ALREADY_ENDED.getCode());
                }
                
                // Cannot end match if it hasn't started yet
                if (match.getStatus() == MatchStatus.PENDING) {
                    throw new BusinessException(
                            "Không thể kết thúc trận đấu khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                
                match.setStatus(MatchStatus.ENDED);
                match.setEndedAt(LocalDateTime.now());
                
                // End current round if in progress
                matchRoundRepository.findByMatchIdAndRoundNumber(match.getId(), match.getCurrentRound())
                        .ifPresent(currentRound -> {
                            if (currentRound.getStatus() == MatchStatus.IN_PROGRESS || 
                                currentRound.getStatus() == MatchStatus.PAUSED) {
                                currentRound.setStatus(MatchStatus.ENDED);
                                currentRound.setEndedAt(LocalDateTime.now());
                                // Calculate duration
                                if (currentRound.getStartedAt() != null) {
                                    long durationSeconds = java.time.Duration.between(
                                            currentRound.getStartedAt(), LocalDateTime.now()).getSeconds();
                                    currentRound.setDurationSeconds((int) durationSeconds);
                                }
                                // Get current scores from snapshot
                                MatchScoreboardSnapshot snapshot = scoreboardSnapshotRepository.findByMatchId(match.getId())
                                        .orElse(null);
                                if (snapshot != null) {
                                    currentRound.setRedScore(snapshot.getRedScore());
                                    currentRound.setBlueScore(snapshot.getBlueScore());
                                }
                                matchRoundRepository.save(currentRound);
                            }
                        });
                
                // Get final scores for notification
                MatchScoreboardDto finalScoreboard = getScoreboard(match.getId());
                String redScore = String.valueOf(finalScoreboard.getRedAthlete().getScore());
                String blueScore = String.valueOf(finalScoreboard.getBlueAthlete().getScore());
                String winner;
                Corner winnerCorner = null;
                if (finalScoreboard.getRedAthlete().getScore() > finalScoreboard.getBlueAthlete().getScore()) {
                    winner = "ĐỎ";
                    winnerCorner = Corner.RED;
                } else if (finalScoreboard.getBlueAthlete().getScore() > finalScoreboard.getRedAthlete().getScore()) {
                    winner = "XANH";
                    winnerCorner = Corner.BLUE;
                } else {
                    winner = "HÒA";
                    // winnerCorner remains null for tie
                }
                
                // Set winner corner in match
                match.setWinnerCorner(winnerCorner);
                matchRepository.save(match);
                
                // Notify all assessors and disconnect them
                webSocketConnectionEventListener.notifyMatchEndedAndDisconnect(
                        match.getId(), redScore, blueScore, winner);
                break;
        }

        matchRepository.save(match);
        
        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(match.getId());
        
        log.info("Match {} control action: {}", match.getId(), request.getAction());
    }

    @Override
    public void undoLastEvent(String matchId) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        MatchEvent lastEvent = matchEventRepository.findFirstByMatchIdOrderByCreatedAtDesc(matchId)
                .orElseThrow(() -> new BusinessException(
                        MessageConstants.MATCH_CANNOT_UNDO,
                        ErrorCode.MATCH_CANNOT_UNDO.getCode()));

        // Delete the last event
        matchEventRepository.delete(lastEvent);

        // Recalculate scoreboard snapshot
        List<MatchEvent> remainingEvents = matchEventRepository.findByMatchIdOrderByCreatedAtAsc(matchId);
        recalculateScoreboardSnapshot(match, remainingEvents);

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Last event undone for match {}", matchId);
    }

    @Override
    @Transactional
    public void updateRoundDuration(String matchId, Integer roundDurationSeconds) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        // Only allow updating if match hasn't started yet
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi thời gian vòng đấu khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        if (roundDurationSeconds == null || roundDurationSeconds <= 0) {
            throw new BusinessException(
                    "Thời gian vòng đấu phải lớn hơn 0",
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        // Update main round duration (for backward compatibility, also update roundDurationSeconds)
        match.setRoundDurationSeconds(roundDurationSeconds);
        match.setMainRoundDurationSeconds(roundDurationSeconds);
        matchRepository.save(match);
        
        // Update scheduled duration for main rounds (round 1-2)
        List<MatchRound> rounds = matchRoundRepository.findByMatchIdOrderByRoundNumberAsc(matchId);
        for (MatchRound round : rounds) {
            if (round.getRoundNumber() <= 2 && round.getRoundType() == RoundType.MAIN) {
                round.setScheduledDurationSeconds(roundDurationSeconds);
                matchRoundRepository.save(round);
            }
        }

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Main round duration updated for match {} to {} seconds", matchId, roundDurationSeconds);
    }

    @Override
    @Transactional
    public void updateMainRoundDuration(String matchId, Integer mainRoundDurationSeconds) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        // Only allow updating if match hasn't started yet
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi thời gian hiệp chính khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        if (mainRoundDurationSeconds == null || mainRoundDurationSeconds <= 0) {
            throw new BusinessException(
                    "Thời gian hiệp chính phải lớn hơn 0",
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        // Update main round duration
        match.setMainRoundDurationSeconds(mainRoundDurationSeconds);
        match.setRoundDurationSeconds(mainRoundDurationSeconds); // Keep for backward compatibility
        matchRepository.save(match);
        
        // Update scheduled duration for main rounds (round 1-2)
        List<MatchRound> rounds = matchRoundRepository.findByMatchIdOrderByRoundNumberAsc(matchId);
        for (MatchRound round : rounds) {
            if (round.getRoundNumber() <= 2 && round.getRoundType() == RoundType.MAIN) {
                round.setScheduledDurationSeconds(mainRoundDurationSeconds);
                matchRoundRepository.save(round);
            }
        }

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Main round duration updated for match {} to {} seconds", matchId, mainRoundDurationSeconds);
    }

    @Override
    @Transactional
    public void updateTiebreakerDuration(String matchId, Integer tiebreakerDurationSeconds) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        // Only allow updating if match hasn't started yet
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi thời gian hiệp phụ khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        if (tiebreakerDurationSeconds == null || tiebreakerDurationSeconds <= 0) {
            throw new BusinessException(
                    "Thời gian hiệp phụ phải lớn hơn 0",
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        // Update tiebreaker duration
        match.setTiebreakerDurationSeconds(tiebreakerDurationSeconds);
        matchRepository.save(match);
        
        // Update scheduled duration for tiebreaker rounds (round 3+)
        List<MatchRound> rounds = matchRoundRepository.findByMatchIdOrderByRoundNumberAsc(matchId);
        for (MatchRound round : rounds) {
            if (round.getRoundNumber() > 2 && round.getRoundType() == RoundType.TIEBREAKER) {
                round.setScheduledDurationSeconds(tiebreakerDurationSeconds);
                matchRoundRepository.save(round);
            }
        }

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Tiebreaker duration updated for match {} to {} seconds", matchId, tiebreakerDurationSeconds);
    }

    @Override
    @Transactional
    public void updateTotalRounds(String matchId, Integer totalRounds) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        // Only allow updating if match hasn't started yet
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi số lượng vòng đấu khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        if (totalRounds == null || totalRounds < 1) {
            throw new BusinessException(
                    "Số lượng vòng đấu phải lớn hơn hoặc bằng 1",
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        int currentTotalRounds = match.getTotalRounds();
        
        // Update total rounds
        match.setTotalRounds(totalRounds);
        
        // Adjust rounds: create or delete as needed
        if (totalRounds > currentTotalRounds) {
            // Create additional rounds
            for (int roundNumber = currentTotalRounds + 1; roundNumber <= totalRounds; roundNumber++) {
                // Round 1-2: Main rounds, Round 3+: Tiebreaker
                RoundType roundType = (roundNumber <= 2) ? RoundType.MAIN : RoundType.TIEBREAKER;
                Integer scheduledDuration = (roundNumber <= 2) 
                        ? match.getMainRoundDurationSeconds() 
                        : match.getTiebreakerDurationSeconds();
                
                MatchRound round = MatchRound.builder()
                        .match(match)
                        .matchId(match.getId())
                        .roundNumber(roundNumber)
                        .roundType(roundType)
                        .status(MatchStatus.PENDING)
                        .redScore(0)
                        .blueScore(0)
                        .scheduledDurationSeconds(scheduledDuration)
                        .build();
                matchRoundRepository.save(round);
            }
            log.info("Added {} rounds for match {} (from {} to {})", 
                    totalRounds - currentTotalRounds, matchId, currentTotalRounds, totalRounds);
        } else if (totalRounds < currentTotalRounds) {
            // Delete excess rounds (only if they are PENDING)
            List<MatchRound> roundsToDelete = matchRoundRepository.findByMatchIdOrderByRoundNumberAsc(matchId);
            for (MatchRound round : roundsToDelete) {
                if (round.getRoundNumber() > totalRounds && round.getStatus() == MatchStatus.PENDING) {
                    matchRoundRepository.delete(round);
                }
            }
            log.info("Removed {} rounds for match {} (from {} to {})", 
                    currentTotalRounds - totalRounds, matchId, currentTotalRounds, totalRounds);
        }
        
        // Ensure currentRound doesn't exceed totalRounds
        if (match.getCurrentRound() > totalRounds) {
            match.setCurrentRound(totalRounds);
        }
        
        matchRepository.save(match);

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Total rounds updated for match {} to {}", matchId, totalRounds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchRoundDto> getRoundHistory(String matchId) {
        log.info("Getting round history for match {}", matchId);
        
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));
        
        List<MatchRound> rounds = matchRoundRepository.findByMatchIdOrderByRoundNumberAsc(matchId);
        
        return rounds.stream()
                .map(round -> MatchRoundDto.builder()
                        .id(round.getId())
                        .matchId(round.getMatchId())
                        .roundNumber(round.getRoundNumber())
                        .roundType(round.getRoundType() != null ? round.getRoundType().name() : 
                                (round.getRoundNumber() <= 2 ? "MAIN" : "TIEBREAKER"))
                        .status(getStatusText(round.getStatus()))
                        .startedAt(round.getStartedAt())
                        .endedAt(round.getEndedAt())
                        .redScore(round.getRedScore())
                        .blueScore(round.getBlueScore())
                        .durationSeconds(round.getDurationSeconds())
                        .scheduledDurationSeconds(round.getScheduledDurationSeconds())
                        .notes(round.getNotes())
                        .createdAt(round.getCreatedAt())
                        .updatedAt(round.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateField(String matchId, String fieldId) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        // Only allow updating if match hasn't started yet
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi sân thi đấu khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        // Validate field exists if fieldId is provided
        if (fieldId != null && !fieldId.isEmpty()) {
            fieldRepository.findById(fieldId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            String.format("Field not found: %s", fieldId)));
        }

        match.setFieldId(fieldId);
        matchRepository.save(match);

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Field updated for match {} to field {}", matchId, fieldId);
    }

    private void broadcastScoreboardUpdate(String matchId) {
        try {
            MatchScoreboardDto scoreboard = getScoreboard(matchId);
            messagingTemplate.convertAndSend("/topic/match/" + matchId + "/scoreboard", scoreboard);
            log.debug("Broadcasted scoreboard update for match {}", matchId);
        } catch (Exception e) {
            log.error("Error broadcasting scoreboard update for match {}", matchId, e);
        }
    }

    private void createRoundsForMatch(Match match) {
        log.info("Creating {} rounds for match {}", match.getTotalRounds(), match.getId());
        for (int roundNumber = 1; roundNumber <= match.getTotalRounds(); roundNumber++) {
            // Round 1-2: Main rounds (hiệp chính), Round 3+: Tiebreaker (hiệp phụ)
            RoundType roundType = (roundNumber <= 2) ? RoundType.MAIN : RoundType.TIEBREAKER;
            Integer scheduledDuration = (roundNumber <= 2) 
                    ? match.getMainRoundDurationSeconds() 
                    : match.getTiebreakerDurationSeconds();
            
            MatchRound round = MatchRound.builder()
                    .match(match)
                    .matchId(match.getId())
                    .roundNumber(roundNumber)
                    .roundType(roundType)
                    .status(MatchStatus.PENDING)
                    .redScore(0)
                    .blueScore(0)
                    .scheduledDurationSeconds(scheduledDuration)
                    .build();
            matchRoundRepository.save(round);
        }
        log.info("Created {} rounds for match {} (2 main + {} tiebreaker)", 
                match.getTotalRounds(), match.getId(), Math.max(0, match.getTotalRounds() - 2));
    }

    private MatchScoreboardSnapshot createInitialSnapshot(Match match) {
        MatchScoreboardSnapshot snapshot = MatchScoreboardSnapshot.builder()
                .matchId(match.getId())
                .redScore(0)
                .blueScore(0)
                .redMedicalTimeoutCount(0)
                .blueMedicalTimeoutCount(0)
                .redWarningCount(0)
                .blueWarningCount(0)
                .lastEventId(null) // NULL for initial state (no events yet)
                .build();
        return scoreboardSnapshotRepository.save(snapshot);
    }

    private void updateScoreboardSnapshot(Match match, MatchEvent event) {
        MatchScoreboardSnapshot snapshot = scoreboardSnapshotRepository.findByMatchId(match.getId())
                .orElseGet(() -> createInitialSnapshot(match));

        // Calculate scores from all events
        List<MatchEvent> allEvents = matchEventRepository.findByMatchIdOrderByCreatedAtAsc(match.getId());
        recalculateScoreboardSnapshot(match, allEvents);
    }

    private void recalculateScoreboardSnapshot(Match match, List<MatchEvent> events) {
        MatchScoreboardSnapshot snapshot = scoreboardSnapshotRepository.findByMatchId(match.getId())
                .orElseGet(() -> createInitialSnapshot(match));

        int redScore = 0;
        int blueScore = 0;
        int redMedicalTimeoutCount = 0;
        int blueMedicalTimeoutCount = 0;
        int redWarningCount = 0;
        int blueWarningCount = 0;
        String lastEventId = null;

        for (MatchEvent event : events) {
            if (event.getCorner() == Corner.RED) {
                switch (event.getEventType()) {
                    case SCORE_PLUS_1:
                        redScore += 1;
                        break;
                    case SCORE_PLUS_2:
                        redScore += 2;
                        break;
                    case SCORE_MINUS_1:
                        redScore = Math.max(0, redScore - 1);
                        break;
                    case MEDICAL_TIMEOUT:
                        redMedicalTimeoutCount++;
                        break;
                    case WARNING:
                        redWarningCount++;
                        break;
                }
            } else if (event.getCorner() == Corner.BLUE) {
                switch (event.getEventType()) {
                    case SCORE_PLUS_1:
                        blueScore += 1;
                        break;
                    case SCORE_PLUS_2:
                        blueScore += 2;
                        break;
                    case SCORE_MINUS_1:
                        blueScore = Math.max(0, blueScore - 1);
                        break;
                    case MEDICAL_TIMEOUT:
                        blueMedicalTimeoutCount++;
                        break;
                    case WARNING:
                        blueWarningCount++;
                        break;
                }
            }
            lastEventId = event.getId();
        }

        snapshot.setRedScore(redScore);
        snapshot.setBlueScore(blueScore);
        snapshot.setRedMedicalTimeoutCount(redMedicalTimeoutCount);
        snapshot.setBlueMedicalTimeoutCount(blueMedicalTimeoutCount);
        snapshot.setRedWarningCount(redWarningCount);
        snapshot.setBlueWarningCount(blueWarningCount);
        snapshot.setLastEventId(lastEventId);

        scoreboardSnapshotRepository.save(snapshot);
    }

    private String buildEventDescription(RecordScoreEventRequest request) {
        return String.format("%s - %s - Round %d - Time %d", 
                request.getEventType(), 
                request.getCorner(), 
                request.getRound(), 
                request.getTimestampInRoundSeconds());
    }

    private String buildMatchName(Match match) {
        return String.format("%s vs %s", match.getRedAthleteName(), match.getBlueAthleteName());
    }

    private String getStatusText(MatchStatus status) {
        switch (status) {
            case PENDING:
                return "CHỜ BẮT ĐẦU";
            case IN_PROGRESS:
                return "ĐANG ĐẤU";
            case PAUSED:
                return "TẠM DỪNG";
            case ENDED:
                return "KẾT THÚC";
            case CANCELLED:
                return "HỦY";
            default:
                return status.name();
        }
    }

    private MatchEventDto toEventDto(MatchEvent event) {
        return MatchEventDto.builder()
                .assessorIds(event.getAssessorIds())
                .id(event.getId())
                .round(event.getRound())
                .timestampInRoundSeconds(event.getTimestampInRoundSeconds())
                .judgeId(event.getJudgeId())
                .corner(event.getCorner())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .createdAt(event.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void updateScheduledStartTime(String matchId, String scheduledStartTime) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        // Only allow updating if match hasn't started yet
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi giờ bắt đầu dự kiến khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        LocalDateTime scheduledTime = null;
        if (scheduledStartTime != null && !scheduledStartTime.isEmpty()) {
            try {
                scheduledTime = LocalDateTime.parse(scheduledStartTime);
            } catch (Exception e) {
                throw new BusinessException(
                        "Định dạng giờ bắt đầu không hợp lệ. Vui lòng sử dụng định dạng ISO (yyyy-MM-ddTHH:mm:ss)",
                        ErrorCode.INVALID_MATCH_STATUS.getCode());
            }
        }

        match.setScheduledStartTime(scheduledTime);
        matchRepository.save(match);

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Scheduled start time updated for match {} to {}", matchId, scheduledTime);
    }

    @Override
    @Transactional
    public void updateAthletePresence(String matchId, Boolean redAthletePresent, Boolean blueAthletePresent) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        // Only allow updating if match hasn't started yet
        if (match.getStatus() != MatchStatus.PENDING) {
            throw new BusinessException(
                    "Chỉ có thể thay đổi trạng thái xác nhận vận động viên khi trận đấu chưa bắt đầu. Trạng thái hiện tại: " + match.getStatus(),
                    ErrorCode.INVALID_MATCH_STATUS.getCode());
        }

        if (redAthletePresent != null) {
            match.setRedAthletePresent(redAthletePresent);
        }
        if (blueAthletePresent != null) {
            match.setBlueAthletePresent(blueAthletePresent);
        }

        matchRepository.save(match);

        // Broadcast update via WebSocket
        broadcastScoreboardUpdate(matchId);

        log.info("Athlete presence updated for match {}: red={}, blue={}", 
                matchId, redAthletePresent, blueAthletePresent);
    }
}
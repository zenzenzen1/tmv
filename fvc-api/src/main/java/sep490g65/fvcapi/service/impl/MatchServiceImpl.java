package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.ControlMatchRequest;
import sep490g65.fvcapi.dto.request.RecordScoreEventRequest;
import sep490g65.fvcapi.dto.response.MatchAthleteInfoDto;
import sep490g65.fvcapi.dto.response.MatchEventDto;
import sep490g65.fvcapi.dto.response.MatchScoreboardDto;
import sep490g65.fvcapi.entity.Match;
import sep490g65.fvcapi.entity.MatchEvent;
import sep490g65.fvcapi.entity.MatchScoreboardSnapshot;
import sep490g65.fvcapi.enums.*;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.MatchEventRepository;
import sep490g65.fvcapi.repository.MatchRepository;
import sep490g65.fvcapi.repository.MatchScoreboardSnapshotRepository;
import sep490g65.fvcapi.service.MatchService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final MatchEventRepository matchEventRepository;
    private final MatchScoreboardSnapshotRepository scoreboardSnapshotRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public MatchScoreboardDto getScoreboard(String matchId) {
        Match match = matchRepository.findByIdAndDeletedAtIsNull(matchId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.MATCH_NOT_FOUND, matchId)));

        MatchScoreboardSnapshot snapshot = scoreboardSnapshotRepository.findByMatchId(matchId)
                .orElseGet(() -> createInitialSnapshot(match));

        String statusText = getStatusText(match.getStatus());

        return MatchScoreboardDto.builder()
                .matchId(match.getId())
                .matchName(buildMatchName(match))
                .weightClass(match.getWeightClassId())
                .roundType(match.getRoundType())
                .currentRound(match.getCurrentRound())
                .totalRounds(match.getTotalRounds())
                .roundDurationSeconds(match.getRoundDurationSeconds())
                .timeRemainingSeconds(match.getTimeRemainingSeconds())
                .status(statusText)
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
                if (match.getStatus() != MatchStatus.PENDING) {
                    throw new BusinessException(
                            MessageConstants.INVALID_MATCH_STATUS,
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                match.setStatus(MatchStatus.IN_PROGRESS);
                match.setStartedAt(LocalDateTime.now());
                if (request.getCurrentRound() != null) {
                    match.setCurrentRound(request.getCurrentRound());
                }
                if (request.getTimeRemainingSeconds() != null) {
                    match.setTimeRemainingSeconds(request.getTimeRemainingSeconds());
                }
                break;

            case PAUSE:
                if (match.getStatus() != MatchStatus.IN_PROGRESS) {
                    throw new BusinessException(
                            MessageConstants.INVALID_MATCH_STATUS,
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                match.setStatus(MatchStatus.PAUSED);
                if (request.getTimeRemainingSeconds() != null) {
                    match.setTimeRemainingSeconds(request.getTimeRemainingSeconds());
                }
                break;

            case RESUME:
                if (match.getStatus() != MatchStatus.PAUSED) {
                    throw new BusinessException(
                            MessageConstants.INVALID_MATCH_STATUS,
                            ErrorCode.INVALID_MATCH_STATUS.getCode());
                }
                match.setStatus(MatchStatus.IN_PROGRESS);
                if (request.getTimeRemainingSeconds() != null) {
                    match.setTimeRemainingSeconds(request.getTimeRemainingSeconds());
                }
                break;

            case END:
                if (match.getStatus() == MatchStatus.ENDED) {
                    throw new BusinessException(
                            MessageConstants.MATCH_ALREADY_ENDED,
                            ErrorCode.MATCH_ALREADY_ENDED.getCode());
                }
                match.setStatus(MatchStatus.ENDED);
                match.setEndedAt(LocalDateTime.now());
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

    private void broadcastScoreboardUpdate(String matchId) {
        try {
            MatchScoreboardDto scoreboard = getScoreboard(matchId);
            messagingTemplate.convertAndSend("/topic/match/" + matchId + "/scoreboard", scoreboard);
            log.debug("Broadcasted scoreboard update for match {}", matchId);
        } catch (Exception e) {
            log.error("Error broadcasting scoreboard update for match {}", matchId, e);
        }
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
                .lastEventId("") // Empty for initial state
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
        String lastEventId = "";

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
        snapshot.setLastEventId(lastEventId.isEmpty() ? "" : lastEventId);

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
}


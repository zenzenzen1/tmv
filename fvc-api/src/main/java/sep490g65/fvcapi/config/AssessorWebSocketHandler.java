package sep490g65.fvcapi.config;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import sep490g65.fvcapi.dto.request.AssessorVoteRequest;
import sep490g65.fvcapi.dto.request.RecordScoreEventRequest;
import sep490g65.fvcapi.dto.response.AssessorVoteResponse;
import sep490g65.fvcapi.enums.MatchEventType;
import sep490g65.fvcapi.service.AssessorVotingService;
import sep490g65.fvcapi.service.MatchService;

/**
 * WebSocket handler for assessor voting
 * Handles votes from assessors and automatically applies scores when 3/5 consensus is reached
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class AssessorWebSocketHandler {

    private final AssessorVotingService assessorVotingService;
    private final MatchService matchService;
    private final MatchWebSocketHandler matchWebSocketHandler;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketConnectionEventListener connectionEventListener;

    /**
     * Handle vote from assessor
     * Broadcasts to referee screen and applies score automatically if 3/5 consensus
     */
    @MessageMapping("/assessor/vote")
    public void handleAssessorVote(@Valid @Payload AssessorVoteRequest request) {
        log.info("Received vote from assessor {} for match {}: {} {} points", 
                request.getAssessorId(), request.getMatchId(), request.getCorner(), request.getScore());

        try {
            // Process the vote
            AssessorVoteResponse response = assessorVotingService.processVote(request);

            // Broadcast vote status to referee/scoring screen
            messagingTemplate.convertAndSend(
                    "/topic/match/" + request.getMatchId() + "/assessor-votes", 
                    response);

            // If 3/5 consensus reached, automatically apply the score
            if (response.isScoreAccepted()) {
                log.info("✅ Consensus reached! Applying score: {} {} points (votes: {}/{})", 
                        request.getCorner(), request.getScore(), 
                        response.getVoteCount(), response.getTotalAssessors());

                // Apply the score to the match
                String eventType = request.getScore() == 1 ? "SCORE_PLUS_1" : "SCORE_PLUS_2";
                
                // Get current round and time from match
                var scoreboard = matchService.getScoreboard(request.getMatchId());
                // Calculate timestamp based on when the vote was received
                // Since time is tracked on frontend, we use 0 as default timestamp
                // The actual timestamp will be managed by the frontend timer
                int timestampInRoundSeconds = 0;

                // Get all assessor IDs who voted for this score (consensus)
                // response.getVotes() is Map<String, Integer> where:
                //   - Key = assessorId (MatchAssessor ID)
                //   - Value = score (1 or 2)
                // Only contains assessors who voted for the matching corner and score
                String assessorIdsFromResponse = response.getVotes().keySet().stream()
                        .collect(java.util.stream.Collectors.joining(","));
                
                log.info("Assessors who voted for consensus ({} {} points): {}", 
                        request.getCorner(), request.getScore(), assessorIdsFromResponse);

                RecordScoreEventRequest scoreEventRequest = new RecordScoreEventRequest();
                scoreEventRequest.setMatchId(request.getMatchId());
                scoreEventRequest.setRound(scoreboard.getCurrentRound());
                scoreEventRequest.setTimestampInRoundSeconds(Math.max(0, timestampInRoundSeconds));
                scoreEventRequest.setCorner(request.getCorner());
                scoreEventRequest.setEventType(MatchEventType.valueOf(eventType));
                scoreEventRequest.setJudgeId(request.getAssessorId());
                scoreEventRequest.setAssessorIds(assessorIdsFromResponse); // All assessors who voted
                
                matchService.recordScoreEvent(scoreEventRequest);

                // Reset votes after applying score
                assessorVotingService.resetVotes(request.getMatchId());

                // Broadcast updated scoreboard to all subscribers
                matchWebSocketHandler.broadcastScoreboardUpdate(request.getMatchId());

                // Broadcast success message
                messagingTemplate.convertAndSend(
                        "/topic/match/" + request.getMatchId() + "/assessor-votes", 
                        AssessorVoteResponse.builder()
                                .matchId(request.getMatchId())
                                .corner(request.getCorner())
                                .score(request.getScore())
                                .voteCount(response.getVoteCount())
                                .totalAssessors(response.getTotalAssessors())
                                .scoreAccepted(true)
                                .votes(response.getVotes())
                                .build());
            } else {
                // Broadcast current vote status
                messagingTemplate.convertAndSend(
                        "/topic/match/" + request.getMatchId() + "/assessor-votes", 
                        response);
            }

        } catch (Exception e) {
            log.error("Error processing assessor vote", e);
            // Send error back to assessor
            messagingTemplate.convertAndSend(
                    "/topic/match/" + request.getMatchId() + "/assessor-error", 
                    "Error processing vote: " + e.getMessage());
        }
    }

    /**
     * Register assessor connection
     */
    @MessageMapping("/assessor/register")
    public void registerAssessor(
            @Payload java.util.Map<String, String> request,
            @Header("simpSessionId") String sessionId) {
        String matchId = request.get("matchId");
        String assessorId = request.get("assessorId");
        log.info("Registering assessor {} connection for match {} with session {}", assessorId, matchId, sessionId);
        
        // Register the assessor connection with real session ID
        connectionEventListener.registerAssessorConnection(matchId, assessorId, sessionId);
    }

    /**
     * Unregister assessor connection
     */
    @MessageMapping("/assessor/unregister")
    public void unregisterAssessor(
            @Payload java.util.Map<String, String> request,
            @Header("simpSessionId") String sessionId) {
        String matchId = request.get("matchId");
        String assessorId = request.get("assessorId");
        log.info("Unregistering assessor {} connection for match {} with session {}", assessorId, matchId, sessionId);
        
        connectionEventListener.unregisterAssessorConnection(matchId, assessorId);
    }

    /**
     * Request connection status for a match
     */
    @MessageMapping("/match/connections/request")
    public void requestConnectionStatus(@Payload java.util.Map<String, String> request) {
        String matchId = request.get("matchId");
        log.info("Connection status requested for match {}", matchId);
        var status = connectionEventListener.getConnectionStatus(matchId);
        messagingTemplate.convertAndSend("/topic/match/" + matchId + "/assessor-connections", status);
    }

    /**
     * Reset votes for a match (called when starting new action)
     */
    @MessageMapping("/assessor/reset")
    public void resetVotes(@Payload String matchId) {
        log.info("Resetting votes for match {}", matchId);
        assessorVotingService.resetVotes(matchId);
        messagingTemplate.convertAndSend(
                "/topic/match/" + matchId + "/assessor-votes-reset", 
                true);
    }
}


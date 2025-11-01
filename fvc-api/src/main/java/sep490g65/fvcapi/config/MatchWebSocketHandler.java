package sep490g65.fvcapi.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import sep490g65.fvcapi.dto.response.MatchScoreboardDto;
import sep490g65.fvcapi.service.MatchService;

/**
 * WebSocket handler for real-time match scoring updates
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class MatchWebSocketHandler {

    private final MatchService matchService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast scoreboard update to all subscribers of a match
     */
    public void broadcastScoreboardUpdate(String matchId) {
        try {
            MatchScoreboardDto scoreboard = matchService.getScoreboard(matchId);
            messagingTemplate.convertAndSend("/topic/match/" + matchId + "/scoreboard", scoreboard);
            log.debug("Broadcasted scoreboard update for match {}", matchId);
        } catch (Exception e) {
            log.error("Error broadcasting scoreboard update for match {}", matchId, e);
        }
    }

    /**
     * Handle client subscription to match updates
     */
    @MessageMapping("/match/{matchId}/subscribe")
    @SendTo("/topic/match/{matchId}/scoreboard")
    public MatchScoreboardDto subscribeToMatch(String matchId) {
        try {
            log.info("Client subscribed to match {}", matchId);
            return matchService.getScoreboard(matchId);
        } catch (Exception e) {
            log.error("Error handling subscription for match {}", matchId, e);
            return null;
        }
    }
}


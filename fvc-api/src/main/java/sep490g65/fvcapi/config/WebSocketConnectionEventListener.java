package sep490g65.fvcapi.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Listener for WebSocket connection events to track assessor connections
 */
@Component
@Slf4j
public class WebSocketConnectionEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    
    // Store connected assessors by matchId and assessorId
    // Key: matchId, Value: Map<assessorId, ConnectionInfo>
    private final Map<String, Map<String, ConnectionInfo>> matchConnections = new ConcurrentHashMap<>();
    
    public WebSocketConnectionEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        log.info("WebSocket connection established: sessionId={}", sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        log.info("WebSocket connection disconnected: sessionId={}", sessionId);
        
        // Remove from all matches based on session ID
        matchConnections.forEach((matchId, assessorMap) -> {
            boolean removed = assessorMap.entrySet().removeIf(entry -> entry.getValue().getSessionId().equals(sessionId));
            if (removed) {
                log.info("Removed assessor connection from match {} due to disconnect", matchId);
                broadcastConnectionStatus(matchId);
            }
        });
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        String sessionId = headerAccessor.getSessionId();
        
        if (destination != null && destination.contains("/match/") && destination.contains("/assessor")) {
            // Extract matchId and assessorId from subscription
            // Format: /topic/match/{matchId}/assessor/{assessorId} or similar
            String[] parts = destination.split("/");
            String matchId = null;
            String assessorId = null;
            
            for (int i = 0; i < parts.length; i++) {
                if ("match".equals(parts[i]) && i + 1 < parts.length) {
                    matchId = parts[i + 1];
                }
                if ("assessor".equals(parts[i]) && i + 1 < parts.length) {
                    assessorId = parts[i + 1];
                }
            }
            
            if (matchId != null && assessorId != null) {
                log.info("Assessor {} subscribed to match {}: sessionId={}", assessorId, matchId, sessionId);
                addAssessorConnection(matchId, assessorId, sessionId);
                broadcastConnectionStatus(matchId);
            }
        }
    }

    /**
     * Manually register assessor connection (called when assessor connects and identifies)
     */
    public void registerAssessorConnection(String matchId, String assessorId, String sessionId) {
        log.info("Registering assessor connection: matchId={}, assessorId={}, sessionId={}", matchId, assessorId, sessionId);
        addAssessorConnection(matchId, assessorId, sessionId);
        log.info("Assessor registered. Broadcasting connection status for match {}", matchId);
        broadcastConnectionStatus(matchId);
        log.info("Connection status broadcasted. Current connected count: {}", 
                matchConnections.getOrDefault(matchId, new ConcurrentHashMap<>()).size());
    }

    /**
     * Manually unregister assessor connection
     */
    public void unregisterAssessorConnection(String matchId, String assessorId) {
        matchConnections.computeIfPresent(matchId, (k, v) -> {
            v.remove(assessorId);
            return v.isEmpty() ? null : v;
        });
        broadcastConnectionStatus(matchId);
    }

    private void addAssessorConnection(String matchId, String assessorId, String sessionId) {
        matchConnections.computeIfAbsent(matchId, k -> new ConcurrentHashMap<>())
                .put(assessorId, new ConnectionInfo(assessorId, sessionId, System.currentTimeMillis()));
    }

    /**
     * Broadcast connection status to all subscribers (judge screen)
     */
    private void broadcastConnectionStatus(String matchId) {
        Map<String, ConnectionInfo> connectedAssessors = matchConnections.getOrDefault(matchId, new ConcurrentHashMap<>());
        
        AssessorConnectionStatus status = AssessorConnectionStatus.builder()
                .matchId(matchId)
                .connectedCount(connectedAssessors.size())
                .connectedAssessors(connectedAssessors.keySet().stream().collect(Collectors.toList()))
                .timestamp(System.currentTimeMillis())
                .build();
        
        log.info("Broadcasting connection status for match {}: {} assessors connected (IDs: {})", 
                matchId, connectedAssessors.size(), connectedAssessors.keySet());
        
        messagingTemplate.convertAndSend("/topic/match/" + matchId + "/assessor-connections", status);
        log.info("Connection status message sent to /topic/match/{}/assessor-connections", matchId);
    }

    /**
     * Get current connection status for a match
     */
    public AssessorConnectionStatus getConnectionStatus(String matchId) {
        Map<String, ConnectionInfo> connectedAssessors = matchConnections.getOrDefault(matchId, new ConcurrentHashMap<>());
        
        return AssessorConnectionStatus.builder()
                .matchId(matchId)
                .connectedCount(connectedAssessors.size())
                .connectedAssessors(connectedAssessors.keySet().stream().collect(Collectors.toList()))
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Notify all connected assessors that the match has ended and disconnect them
     */
    public void notifyMatchEndedAndDisconnect(String matchId, String redScore, String blueScore, String winner) {
        Map<String, ConnectionInfo> connectedAssessors = matchConnections.getOrDefault(matchId, new ConcurrentHashMap<>());
        
        if (connectedAssessors.isEmpty()) {
            log.info("No connected assessors for match {}, skipping notification", matchId);
            return;
        }
        
        log.info("Notifying {} assessors that match {} has ended", connectedAssessors.size(), matchId);
        
        // Create match ended message
        Map<String, Object> matchEndedMessage = new java.util.HashMap<>();
        matchEndedMessage.put("type", "MATCH_ENDED");
        matchEndedMessage.put("matchId", matchId);
        matchEndedMessage.put("message", "Trận đấu đã kết thúc");
        matchEndedMessage.put("redScore", redScore);
        matchEndedMessage.put("blueScore", blueScore);
        matchEndedMessage.put("winner", winner);
        matchEndedMessage.put("timestamp", System.currentTimeMillis());
        
        // Broadcast to all assessors subscribed to this match
        messagingTemplate.convertAndSend("/topic/match/" + matchId + "/match-ended", matchEndedMessage);
        
        log.info("Match ended notification sent to all assessors for match {}", matchId);
        
        // Clear connections for this match (they will disconnect on client side)
        // Don't remove immediately, let clients disconnect naturally after receiving message
        // matchConnections.remove(matchId);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ConnectionInfo {
        private String assessorId;
        private String sessionId;
        private long connectedAt;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AssessorConnectionStatus {
        private String matchId;
        private int connectedCount;
        private java.util.List<String> connectedAssessors;
        private long timestamp;
    }
}


package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.ControlMatchRequest;
import sep490g65.fvcapi.dto.request.RecordScoreEventRequest;
import sep490g65.fvcapi.dto.response.MatchEventDto;
import sep490g65.fvcapi.dto.response.MatchScoreboardDto;

import java.util.List;

public interface MatchService {
    
    /**
     * Get match scoreboard with current state
     */
    MatchScoreboardDto getScoreboard(String matchId);
    
    /**
     * Get event history for a match
     */
    List<MatchEventDto> getEventHistory(String matchId);
    
    /**
     * Record a score event (e.g., +1, +2, -1, medical timeout, warning)
     */
    void recordScoreEvent(RecordScoreEventRequest request);
    
    /**
     * Control match (start, pause, resume, end)
     */
    void controlMatch(ControlMatchRequest request);
    
    /**
     * Undo last event
     */
    void undoLastEvent(String matchId);
}


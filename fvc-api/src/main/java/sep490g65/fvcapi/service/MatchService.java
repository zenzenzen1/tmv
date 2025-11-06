package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.ControlMatchRequest;
import sep490g65.fvcapi.dto.request.CreateMatchRequest;
import sep490g65.fvcapi.dto.request.RecordScoreEventRequest;
import sep490g65.fvcapi.dto.response.MatchEventDto;
import sep490g65.fvcapi.dto.response.MatchListItemDto;
import sep490g65.fvcapi.dto.response.MatchScoreboardDto;

import java.util.List;

public interface MatchService {
    
    /**
     * Create a new match
     */
    MatchScoreboardDto createMatch(CreateMatchRequest request, String userId);
    
    /**
     * List all matches (optionally filtered by competition or status)
     */
    List<MatchListItemDto> listMatches(String competitionId, String status);
    
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
    
    /**
     * Update round duration for a match
     */
    void updateRoundDuration(String matchId, Integer roundDurationSeconds);
}


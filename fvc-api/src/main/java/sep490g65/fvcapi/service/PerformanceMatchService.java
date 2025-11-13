package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.CreatePerformanceMatchRequest;
import sep490g65.fvcapi.dto.response.PerformanceMatchResponse;
import sep490g65.fvcapi.dto.request.SavePerformanceMatchSetupRequest;
import sep490g65.fvcapi.entity.PerformanceMatch;
import sep490g65.fvcapi.dto.response.MatchAssessorResponse;

import java.util.List;

public interface PerformanceMatchService {
    
    PerformanceMatchResponse createPerformanceMatch(CreatePerformanceMatchRequest request);
    
    PerformanceMatchResponse getPerformanceMatchById(String id);
    
    PerformanceMatchResponse getPerformanceMatchByPerformanceId(String performanceId);
    
    List<PerformanceMatchResponse> getPerformanceMatchesByCompetitionId(String competitionId);
    
    PerformanceMatchResponse updatePerformanceMatchStatus(String id, PerformanceMatch.MatchStatus status);
    
    PerformanceMatchResponse updatePerformanceMatch(String id, CreatePerformanceMatchRequest request);
    
    void deletePerformanceMatch(String id);
    
    /**
     * Save performance match setup: Create PerformanceMatch and link all assessors assigned to this performance
     * This is called when user clicks "Save" in manage/performance
     */
    PerformanceMatchResponse savePerformanceMatchSetup(String performanceId, SavePerformanceMatchSetupRequest options);

    List<MatchAssessorResponse> getAssessorsByPerformanceMatchId(String performanceMatchId);
}


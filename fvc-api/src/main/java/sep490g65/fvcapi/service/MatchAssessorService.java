package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.AssignMatchAssessorsRequest;
import sep490g65.fvcapi.dto.request.CreateMatchAssessorRequest;
import sep490g65.fvcapi.dto.request.UpdateMatchAssessorRequest;
import sep490g65.fvcapi.dto.response.MatchAssessorResponse;

import java.util.List;

public interface MatchAssessorService {
    
    /**
     * Assign multiple assessors to a match at once
     */
    List<MatchAssessorResponse> assignAssessors(AssignMatchAssessorsRequest request);
    
    /**
     * Create a single assessor for a match
     */
    MatchAssessorResponse createAssessor(CreateMatchAssessorRequest request);
    
    /**
     * Update an existing assessor
     */
    MatchAssessorResponse updateAssessor(String assessorId, UpdateMatchAssessorRequest request);
    
    /**
     * Get all assessors for a match
     */
    List<MatchAssessorResponse> getAssessorsByMatchId(String matchId);
    
    /**
     * Get assessor by ID
     */
    MatchAssessorResponse getAssessorById(String assessorId);
    
    /**
     * Remove an assessor from a match
     */
    void removeAssessor(String assessorId);
    
    /**
     * Remove all assessors from a match
     */
    void removeAllAssessors(String matchId);
    
    /**
     * Get assessors by user ID
     */
    List<MatchAssessorResponse> getAssessorsByUserId(String userId);
}


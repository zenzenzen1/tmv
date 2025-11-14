package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.AssignAssessorRequest;
import sep490g65.fvcapi.dto.request.AssignMatchAssessorsRequest;
import sep490g65.fvcapi.dto.request.CreateMatchAssessorRequest;
import sep490g65.fvcapi.dto.request.UpdateMatchAssessorRequest;
import sep490g65.fvcapi.dto.response.MatchAssessorResponse;
import sep490g65.fvcapi.dto.response.MyAssignedMatchResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.dto.request.AssignPerformanceAssessorsRequest;

import java.util.List;

public interface MatchAssessorService {
    
    // Methods from AssessorService
    List<UserResponse> listAvailableAssessors();
    
    List<MatchAssessorResponse> listByCompetition(String competitionId);
    
    List<MatchAssessorResponse> listByCompetitionAndSpecialization(String competitionId, MatchAssessor.Specialization specialization);
    
    List<MatchAssessorResponse> listByUserId(String userId);
    
    MatchAssessorResponse assignAssessor(AssignAssessorRequest request, String assignedByUserId);
    
    void unassignAssessor(String assessorId);
    
    // Original MatchAssessorService methods
    /**
     * Assign multiple assessors to a match at once
     */
    List<MatchAssessorResponse> assignAssessors(AssignMatchAssessorsRequest request);

    /**
     * Assign multiple assessors to a performance match (Quyền/Võ nhạc) at once.
     */
    List<MatchAssessorResponse> assignPerformanceAssessors(AssignPerformanceAssessorsRequest request, String assignedByUserId);
    
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
    
    /**
     * Get my assigned matches (for current user)
     */
    List<MyAssignedMatchResponse> getMyAssignedMatches(String userId);
}


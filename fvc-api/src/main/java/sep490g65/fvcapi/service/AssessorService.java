package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.AssignAssessorRequest;
import sep490g65.fvcapi.dto.response.AssessorResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.entity.Assessor;

import java.util.List;

public interface AssessorService {
    List<UserResponse> listAvailableAssessors();
    
    List<AssessorResponse> listByCompetition(String competitionId);
    
    List<AssessorResponse> listByCompetitionAndSpecialization(String competitionId, Assessor.Specialization specialization);
    
    List<AssessorResponse> listByUserId(String userId);
    
    AssessorResponse assignAssessor(AssignAssessorRequest request, String assignedByUserId);
    
    void unassignAssessor(String assessorId);
}


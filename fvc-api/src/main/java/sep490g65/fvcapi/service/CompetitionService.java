package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.CompetitionFilters;
import sep490g65.fvcapi.dto.request.CreateCompetitionRequest;
import sep490g65.fvcapi.dto.request.UpdateCompetitionRequest;
import sep490g65.fvcapi.dto.response.CompetitionResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.enums.TournamentStatus;

public interface CompetitionService {
    
    PaginationResponse<CompetitionResponse> getAllCompetitions(CompetitionFilters filters);
    
    CompetitionResponse getCompetitionById(String id);
    
    CompetitionResponse createCompetition(CreateCompetitionRequest request);
    
    CompetitionResponse updateCompetition(String id, UpdateCompetitionRequest request);
    
    void deleteCompetition(String id);
    
    CompetitionResponse changeStatus(String id, TournamentStatus status);
}


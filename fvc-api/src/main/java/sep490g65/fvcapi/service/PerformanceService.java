package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.CreatePerformanceRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.Performance;

import java.util.List;

public interface PerformanceService {
    
    PerformanceResponse createPerformance(CreatePerformanceRequest request);
    
    PerformanceResponse getPerformanceById(String id);
    
    List<PerformanceResponse> getPerformancesByCompetitionId(String competitionId);
    
    List<PerformanceResponse> getPerformancesByCompetitionIdAndType(String competitionId, Performance.PerformanceType performanceType);
    
    List<PerformanceResponse> getPerformancesByCompetitionIdAndContentType(String competitionId, Performance.ContentType contentType);
    
    PerformanceResponse updatePerformanceStatus(String id, Performance.PerformanceStatus status);
    
    PerformanceResponse startPerformance(String id);
    
    PerformanceResponse completePerformance(String id);
    
    PerformanceResponse cancelPerformance(String id);
    
    void deletePerformance(String id);
    
    PerformanceResponse addAthleteToPerformance(String performanceId, String athleteId, Integer teamPosition, Boolean isCaptain);
    
    void removeAthleteFromPerformance(String performanceId, String athleteId);
}

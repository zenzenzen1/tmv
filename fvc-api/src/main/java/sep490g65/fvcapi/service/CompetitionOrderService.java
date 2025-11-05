package sep490g65.fvcapi.service;

import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreateCompetitionOrderRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateCompetitionOrderRequest;
import sep490g65.fvcapi.dto.response.CompetitionOrderResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.CompetitionOrder;

import java.util.List;

public interface CompetitionOrderService {

    @Transactional(readOnly = true)
    PaginationResponse<CompetitionOrderResponse> list(RequestParam params);

    @Transactional(readOnly = true)
    List<CompetitionOrderResponse> findByCompetitionId(String competitionId);

    @Transactional(readOnly = true)
    CompetitionOrderResponse getById(String id);

    CompetitionOrder create(CreateCompetitionOrderRequest request);

    List<CompetitionOrder> createBulk(List<CreateCompetitionOrderRequest> requests);

    CompetitionOrderResponse update(String id, UpdateCompetitionOrderRequest request);

    void delete(String id);

    void deleteByCompetitionId(String competitionId);

    @Transactional(readOnly = true)
    List<CompetitionOrderResponse> findByCompetitionIdAndContentSelectionId(
            String competitionId, 
            String contentSelectionId
    );
    
    
}

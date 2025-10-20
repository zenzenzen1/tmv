package sep490g65.fvcapi.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.request.UpdateCompetitionOrderRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.CompetitionOrderResponse;
import sep490g65.fvcapi.service.CompetitionOrderService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/competition-orders")
@RequiredArgsConstructor
public class CompetitionOrderController {
    private final CompetitionOrderService competitionOrderService;

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<BaseResponse<List<CompetitionOrderResponse>>> getByCompetitionId(
            @PathVariable String competitionId) {
        
        List<CompetitionOrderResponse> orders = competitionOrderService.findByCompetitionId(competitionId);
        return ResponseEntity.ok(ResponseUtils.success("Competition orders retrieved successfully", orders));
    }

    @GetMapping("/competition/{competitionId}/content/{contentSelectionId}")
    public ResponseEntity<BaseResponse<List<CompetitionOrderResponse>>> getByCompetitionAndContent(
            @PathVariable String competitionId,
            @PathVariable String contentSelectionId) {
        
        List<CompetitionOrderResponse> orders = competitionOrderService
                .findByCompetitionIdAndContentSelectionId(competitionId, contentSelectionId);
        return ResponseEntity.ok(ResponseUtils.success("Competition orders retrieved successfully", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<CompetitionOrderResponse>> getById(@PathVariable String id) {
        CompetitionOrderResponse order = competitionOrderService.getById(id);
        return ResponseEntity.ok(ResponseUtils.success("Competition order retrieved successfully", order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<CompetitionOrderResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateCompetitionOrderRequest request) {
        
        CompetitionOrderResponse updated = competitionOrderService.update(id, request);
        return ResponseEntity.ok(ResponseUtils.success("Competition order updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable String id) {
        competitionOrderService.delete(id);
        return ResponseEntity.ok(ResponseUtils.success("Competition order deleted successfully"));
    }

    @DeleteMapping("/competition/{competitionId}")
    public ResponseEntity<BaseResponse<Void>> deleteByCompetitionId(@PathVariable String competitionId) {
        competitionOrderService.deleteByCompetitionId(competitionId);
        return ResponseEntity.ok(ResponseUtils.success("All competition orders deleted successfully"));
    }
}

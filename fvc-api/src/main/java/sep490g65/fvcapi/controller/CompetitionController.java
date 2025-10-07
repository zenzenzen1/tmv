package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CompetitionFilters;
import sep490g65.fvcapi.dto.request.CreateCompetitionRequest;
import sep490g65.fvcapi.dto.request.UpdateCompetitionRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.CompetitionResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.enums.ErrorCode;
import sep490g65.fvcapi.enums.TournamentStatus;
import sep490g65.fvcapi.service.CompetitionService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/competitions")
@Validated
@RequiredArgsConstructor
@Slf4j
public class CompetitionController {
    
    private final CompetitionService competitionService;
    
    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<CompetitionResponse>>> getAllCompetitions(
            @Valid @ModelAttribute CompetitionFilters filters) {
        try {
            PaginationResponse<CompetitionResponse> competitions = competitionService.getAllCompetitions(filters);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.COMPETITIONS_RETRIEVED_SUCCESS, competitions));
        } catch (Exception e) {
            log.error("Error fetching competitions", e);
            return ResponseEntity.badRequest()
                    .body(ResponseUtils.error(MessageConstants.COMPETITION_FETCH_ERROR, ErrorCode.COMPETITION_FETCH_ERROR.getCode()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<CompetitionResponse>> getCompetitionById(@PathVariable String id) {
        try {
            CompetitionResponse competition = competitionService.getCompetitionById(id);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.COMPETITION_RETRIEVED_SUCCESS, competition));
        } catch (Exception e) {
            log.error("Error fetching competition with id: {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ResponseUtils.error(MessageConstants.COMPETITION_FETCH_ERROR, ErrorCode.COMPETITION_FETCH_ERROR.getCode()));
        }
    }
    
    @PostMapping
    public ResponseEntity<BaseResponse<CompetitionResponse>> createCompetition(
            @Valid @RequestBody CreateCompetitionRequest request) {
        try {
            CompetitionResponse competition = competitionService.createCompetition(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success(MessageConstants.COMPETITION_CREATED_SUCCESS, competition));
        } catch (Exception e) {
            log.error("Error creating competition", e);
            return ResponseEntity.badRequest()
                    .body(ResponseUtils.error(MessageConstants.COMPETITION_CREATE_ERROR, ErrorCode.COMPETITION_CREATE_ERROR.getCode()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<CompetitionResponse>> updateCompetition(
            @PathVariable String id,
            @Valid @RequestBody UpdateCompetitionRequest request) {
        try {
            CompetitionResponse competition = competitionService.updateCompetition(id, request);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.COMPETITION_UPDATED_SUCCESS, competition));
        } catch (Exception e) {
            log.error("Error updating competition with id: {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ResponseUtils.error(MessageConstants.COMPETITION_UPDATE_ERROR, ErrorCode.COMPETITION_UPDATE_ERROR.getCode()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> deleteCompetition(@PathVariable String id) {
        try {
            competitionService.deleteCompetition(id);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.COMPETITION_DELETED_SUCCESS));
        } catch (Exception e) {
            log.error("Error deleting competition with id: {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ResponseUtils.error(MessageConstants.COMPETITION_DELETE_ERROR, ErrorCode.COMPETITION_DELETE_ERROR.getCode()));
        }
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<BaseResponse<CompetitionResponse>> changeStatus(
            @PathVariable String id,
            @RequestParam TournamentStatus status) {
        try {
            CompetitionResponse competition = competitionService.changeStatus(id, status);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.COMPETITION_STATUS_UPDATED_SUCCESS, competition));
        } catch (Exception e) {
            log.error("Error changing status for competition with id: {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ResponseUtils.error(MessageConstants.COMPETITION_STATUS_CHANGE_ERROR, ErrorCode.COMPETITION_STATUS_CHANGE_ERROR.getCode()));
        }
    }
}

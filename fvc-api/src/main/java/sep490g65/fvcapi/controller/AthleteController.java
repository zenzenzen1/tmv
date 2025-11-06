package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.service.AthleteService;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.utils.ResponseUtils;
import jakarta.validation.Valid;
import sep490g65.fvcapi.dto.request.ArrangeFistOrderRequest;
import sep490g65.fvcapi.dto.request.UpdateSeedNumbersRequest;
import sep490g65.fvcapi.dto.request.UpdateAthletesStatusRequest;

import java.util.List;


@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/athletes")
@RequiredArgsConstructor
@Slf4j
public class AthleteController {
    private final AthleteService athleteService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<sep490g65.fvcapi.dto.response.AthleteResolvedResponse>>> list(@RequestParam(defaultValue = "0") int page,
                                                                         @RequestParam(defaultValue = "5") int size,
                                                                         @RequestParam(required = false, name = "competitionId") String competitionId,
                                                                         @RequestParam(required = false) Athlete.CompetitionType competitionType,
                                                                         @RequestParam(required = false) String subCompetitionType,
                                                                         @RequestParam(required = false) String detailSubCompetitionType,
                                                                         @RequestParam(required = false) String name,
                                                                         @RequestParam(required = false) Athlete.Gender gender,
                                                                         @RequestParam(required = false) Athlete.AthleteStatus status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Athlete> result = athleteService.list(competitionId, competitionType, subCompetitionType, detailSubCompetitionType, name, gender, status, pageable);
        // Map to resolved label DTO with backend label resolution
        Page<sep490g65.fvcapi.dto.response.AthleteResolvedResponse> mapped = result.map(a -> {
            String label = athleteService.resolveDetailLabel(a);
            sep490g65.fvcapi.dto.response.AthleteResolvedResponse dto = sep490g65.fvcapi.dto.response.AthleteResolvedResponse.from(a);
            dto.setDetailSubLabel(label);
            // Enrich with team info via performance link and submission
            sep490g65.fvcapi.service.AthleteService.TeamInfo t = athleteService.resolveTeamInfo(a);
            if (t != null) {
                dto.setPerformanceId(t.getPerformanceId());
                if (t.getTeamName() != null) dto.setTeamName(t.getTeamName());
                if (t.getRegistrantEmail() != null) dto.setRegistrantEmail(t.getRegistrantEmail());
            }
            return dto;
        });
        PaginationResponse<sep490g65.fvcapi.dto.response.AthleteResolvedResponse> payload = ResponseUtils.createPaginatedResponse(mapped);
        return ResponseEntity.ok(ResponseUtils.success("Athletes retrieved", payload));
    }

    @GetMapping("/by-competition-weight-class")
    public ResponseEntity<BaseResponse<List<sep490g65.fvcapi.dto.response.AthleteResolvedResponse>>> getByCompetitionAndWeightClass(
            @RequestParam String competitionId,
            @RequestParam String weightClassId) {
        List<Athlete> athletes = athleteService.getByCompetitionAndWeightClass(competitionId, weightClassId);
        List<sep490g65.fvcapi.dto.response.AthleteResolvedResponse> mapped = athletes.stream()
                .map(a -> {
                    String label = athleteService.resolveDetailLabel(a);
                    sep490g65.fvcapi.dto.response.AthleteResolvedResponse dto = sep490g65.fvcapi.dto.response.AthleteResolvedResponse.from(a);
                    dto.setDetailSubLabel(label);
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(ResponseUtils.success("Athletes retrieved", mapped));
    }

    @PostMapping("/arrange-order")
    public ResponseEntity<BaseResponse<Void>> arrangeOrder(@Valid @RequestBody ArrangeFistOrderRequest request) {
        // TODO: Implement arrange order logic
        athleteService.arrangeOrder(
                request.getCompetitionId(),
                request.getCompetitionType() != null ? request.getCompetitionType().name() : null,
                request.getAthleteOrders()
        );
        return ResponseEntity.ok(ResponseUtils.success("Arrange order saved"));
    }

    @PutMapping("/seed-numbers")
    public ResponseEntity<BaseResponse<Void>> updateSeedNumbers(@Valid @RequestBody UpdateSeedNumbersRequest request) {
        log.info("🎲 [AthleteController] Received request to update seed numbers for {} athletes", request.getUpdates().size());
        athleteService.updateSeedNumbers(request.getUpdates());
        log.info("✅ [AthleteController] Successfully updated seed numbers");
        return ResponseEntity.ok(ResponseUtils.success("Seed numbers updated successfully"));
    }

    @PutMapping("/status")
    public ResponseEntity<BaseResponse<Void>> updateAthletesStatus(@Valid @RequestBody UpdateAthletesStatusRequest request) {
        log.info("🔄 [AthleteController] Received request to update status for {} athletes to {}", 
                request != null && request.getAthleteIds() != null ? request.getAthleteIds().size() : 0, 
                request != null ? request.getStatus() : "null");
        
        if (request == null || request.getAthleteIds() == null || request.getAthleteIds().isEmpty()) {
            log.warn("⚠️ [AthleteController] Invalid request: request or athleteIds is null/empty");
            return ResponseEntity.ok(ResponseUtils.error("Invalid request: athleteIds cannot be empty", "INVALID_REQUEST"));
        }
        
        if (request.getStatus() == null) {
            log.warn("⚠️ [AthleteController] Invalid request: status is null");
            return ResponseEntity.ok(ResponseUtils.error("Invalid request: status is required", "INVALID_REQUEST"));
        }
        
        try {
            athleteService.updateAthletesStatus(request.getAthleteIds(), request.getStatus());
            log.info("✅ [AthleteController] Successfully updated athletes status");
            return ResponseEntity.ok(ResponseUtils.success("Athletes status updated successfully"));
        } catch (Exception e) {
            log.error("❌ [AthleteController] Error updating athletes status", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to update athletes status: " + e.getMessage(), "UPDATE_STATUS_ERROR"));
        }
    }
}



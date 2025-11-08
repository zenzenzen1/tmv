package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.phase.ChallengePhaseCreateRequest;
import sep490g65.fvcapi.dto.phase.ChallengePhaseDto;
import sep490g65.fvcapi.dto.phase.ChallengePhaseUpdateRequest;
import sep490g65.fvcapi.dto.phase.PhaseOrderUpdate;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.enums.PhaseStatus;
import sep490g65.fvcapi.service.ChallengePhaseService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH)
@Validated
@RequiredArgsConstructor
public class ChallengePhaseController {

    private final ChallengePhaseService challengePhaseService;

    @GetMapping(ApiConstants.CYCLES_PATH + "/{cycleId}" + ApiConstants.PHASES_PATH)
    public ResponseEntity<BaseResponse<PaginationResponse<ChallengePhaseDto>>> listByCycle(
            @PathVariable String cycleId,
            @RequestParam(required = false) PhaseStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<ChallengePhaseDto> page = challengePhaseService.listByCycle(cycleId, status, search, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Phases retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping(ApiConstants.PHASES_PATH + "/{id}")
    public ResponseEntity<BaseResponse<ChallengePhaseDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Phase retrieved",
                challengePhaseService.getById(id)));
    }

    @PostMapping(ApiConstants.CYCLES_PATH + "/{cycleId}" + ApiConstants.PHASES_PATH)
    public ResponseEntity<BaseResponse<ChallengePhaseDto>> create(
            @PathVariable String cycleId,
            @RequestBody @Validated ChallengePhaseCreateRequest request) {
        ChallengePhaseDto created = challengePhaseService.create(cycleId, request);
        return ResponseEntity.ok(ResponseUtils.success("Phase created", created));
    }

    @PutMapping(ApiConstants.PHASES_PATH + "/{id}")
    public ResponseEntity<BaseResponse<ChallengePhaseDto>> update(
            @PathVariable String id,
            @RequestBody @Validated ChallengePhaseUpdateRequest request) {
        return ResponseEntity.ok(ResponseUtils.success("Phase updated",
                challengePhaseService.update(id, request)));
    }

    @PostMapping(ApiConstants.CYCLES_PATH + "/{cycleId}" + ApiConstants.PHASES_PATH + "/reorder")
    public ResponseEntity<BaseResponse<Void>> reorder(
            @PathVariable String cycleId,
            @RequestBody @Validated List<PhaseOrderUpdate> orderUpdates) {
        challengePhaseService.reorder(cycleId, orderUpdates);
        return ResponseEntity.ok(ResponseUtils.success("Phases reordered"));
    }
}



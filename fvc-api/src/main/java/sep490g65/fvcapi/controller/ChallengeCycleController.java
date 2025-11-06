package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleBulkCreateRequest;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleCreateRequest;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleDto;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleUpdateRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;
import sep490g65.fvcapi.service.ChallengeCycleService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.CYCLES_PATH)
@Validated
@RequiredArgsConstructor
public class ChallengeCycleController {

    private final ChallengeCycleService challengeCycleService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<ChallengeCycleDto>>> list(
            @RequestParam(required = false) ChallengeCycleStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<ChallengeCycleDto> page = challengeCycleService.list(status, search, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Cycles retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<ChallengeCycleDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Cycle retrieved",
                challengeCycleService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<ChallengeCycleDto>> create(@RequestBody @Validated ChallengeCycleCreateRequest request) {
        ChallengeCycleDto created = challengeCycleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success("Cycle created", created));
    }

    @PostMapping("/bulk")
    public ResponseEntity<BaseResponse<ChallengeCycleDto>> createBulk(@RequestBody @Validated ChallengeCycleBulkCreateRequest request) {
        ChallengeCycleDto created = challengeCycleService.createBulk(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success("Cycle created with phases and teams", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<ChallengeCycleDto>> update(@PathVariable String id,
                                                                   @RequestBody @Validated ChallengeCycleUpdateRequest request) {
        return ResponseEntity.ok(ResponseUtils.success("Cycle updated",
                challengeCycleService.update(id, request)));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<BaseResponse<ChallengeCycleDto>> activate(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Cycle activated",
                challengeCycleService.activate(id)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<BaseResponse<ChallengeCycleDto>> complete(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Cycle completed",
                challengeCycleService.complete(id)));
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<BaseResponse<ChallengeCycleDto>> archive(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Cycle archived",
                challengeCycleService.archive(id)));
    }
}



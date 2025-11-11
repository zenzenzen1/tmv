package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.training.TrainingSessionCreateRequest;
import sep490g65.fvcapi.dto.training.TrainingSessionDto;
import sep490g65.fvcapi.dto.training.TrainingSessionUpdateRequest;
import sep490g65.fvcapi.enums.TrainingSessionStatus;
import sep490g65.fvcapi.service.TrainingSessionService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.time.LocalDateTime;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.TRAINING_SESSIONS_PATH)
@Validated
@RequiredArgsConstructor
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<TrainingSessionDto>>> list(
            @RequestParam(required = false) String cycleId,
            @RequestParam(required = false) String teamId,
            @RequestParam(required = false) String phaseId,
            @RequestParam(required = false) String locationId,
            @RequestParam(required = false) TrainingSessionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Pageable pageable
    ) {
        Page<TrainingSessionDto> page = trainingSessionService.list(
                cycleId, teamId, phaseId, locationId, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Training sessions retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping("/calendar")
    public ResponseEntity<BaseResponse<PaginationResponse<TrainingSessionDto>>> getCalendar(
            @RequestParam(required = false) String cycleId,
            @RequestParam(required = false) String teamId,
            @RequestParam(required = false) String phaseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Pageable pageable
    ) {
        Page<TrainingSessionDto> page = trainingSessionService.getCalendar(
                cycleId, teamId, phaseId, startDate, endDate, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Calendar retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<TrainingSessionDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Training session retrieved",
                trainingSessionService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<TrainingSessionDto>> create(@RequestBody @Valid TrainingSessionCreateRequest request) {
        TrainingSessionDto created = trainingSessionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success("Training session created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<TrainingSessionDto>> update(
            @PathVariable String id,
            @RequestBody @Valid TrainingSessionUpdateRequest request
    ) {
        TrainingSessionDto updated = trainingSessionService.update(id, request);
        return ResponseEntity.ok(ResponseUtils.success("Training session updated", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BaseResponse<TrainingSessionDto>> updateStatus(
            @PathVariable String id,
            @RequestParam TrainingSessionStatus status
    ) {
        TrainingSessionDto updated = trainingSessionService.updateStatus(id, status);
        return ResponseEntity.ok(ResponseUtils.success("Training session status updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable String id) {
        trainingSessionService.delete(id);
        return ResponseEntity.ok(ResponseUtils.success("Training session deleted"));
    }
}



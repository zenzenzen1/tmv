package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.attendance.BulkAttendanceRequest;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceCreateRequest;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceDto;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceUpdateRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.service.SessionAttendanceService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.Map;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.TRAINING_SESSIONS_PATH + "/{sessionId}" + ApiConstants.ATTENDANCE_SUBPATH)
@Validated
@RequiredArgsConstructor
public class SessionAttendanceController {

    private final SessionAttendanceService sessionAttendanceService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<SessionAttendanceDto>>> getAttendance(
            @PathVariable String sessionId,
            Pageable pageable
    ) {
        Page<SessionAttendanceDto> page = sessionAttendanceService.findBySession(sessionId, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Attendance retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<SessionAttendanceDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Attendance retrieved",
                sessionAttendanceService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<SessionAttendanceDto>> markAttendance(
            @PathVariable String sessionId,
            @RequestBody @Valid SessionAttendanceCreateRequest request
    ) {
        SessionAttendanceDto created = sessionAttendanceService.markAttendance(sessionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success("Attendance marked", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<SessionAttendanceDto>> updateAttendance(
            @PathVariable String id,
            @RequestBody @Valid SessionAttendanceUpdateRequest request
    ) {
        SessionAttendanceDto updated = sessionAttendanceService.updateAttendance(id, request);
        return ResponseEntity.ok(ResponseUtils.success("Attendance updated", updated));
    }

    @PostMapping("/bulk")
    public ResponseEntity<BaseResponse<Void>> bulkMarkAttendance(
            @PathVariable String sessionId,
            @RequestBody @Valid BulkAttendanceRequest request
    ) {
        sessionAttendanceService.bulkMarkAttendance(sessionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success("Bulk attendance marked"));
    }

    @GetMapping("/statistics")
    public ResponseEntity<BaseResponse<Map<String, Long>>> getStatistics(@PathVariable String sessionId) {
        Map<String, Long> stats = sessionAttendanceService.getStatistics(sessionId);
        return ResponseEntity.ok(ResponseUtils.success("Statistics retrieved", stats));
    }
}



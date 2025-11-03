package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.request.AssignMatchAssessorsRequest;
import sep490g65.fvcapi.dto.request.CreateMatchAssessorRequest;
import sep490g65.fvcapi.dto.request.UpdateMatchAssessorRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.MatchAssessorResponse;
import sep490g65.fvcapi.service.MatchAssessorService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/match-assessors")
@RequiredArgsConstructor
@Slf4j
public class MatchAssessorController {

    private final MatchAssessorService matchAssessorService;

    /**
     * Assign multiple assessors to a match at once
     */
    @PostMapping("/assign")
    public ResponseEntity<BaseResponse<List<MatchAssessorResponse>>> assignAssessors(
            @Valid @RequestBody AssignMatchAssessorsRequest request) {
        try {
            List<MatchAssessorResponse> assessors = matchAssessorService.assignAssessors(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success("Assessors assigned successfully", assessors));
        } catch (Exception e) {
            log.error("Error assigning assessors to match {}", request.getMatchId(), e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "ASSIGN_ASSESSORS_ERROR"));
        }
    }

    /**
     * Create a single assessor for a match
     */
    @PostMapping
    public ResponseEntity<BaseResponse<MatchAssessorResponse>> createAssessor(
            @Valid @RequestBody CreateMatchAssessorRequest request) {
        try {
            MatchAssessorResponse assessor = matchAssessorService.createAssessor(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success("Assessor created successfully", assessor));
        } catch (Exception e) {
            log.error("Error creating assessor", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "CREATE_ASSESSOR_ERROR"));
        }
    }

    /**
     * Update an existing assessor
     */
    @PutMapping("/{assessorId}")
    public ResponseEntity<BaseResponse<MatchAssessorResponse>> updateAssessor(
            @PathVariable String assessorId,
            @Valid @RequestBody UpdateMatchAssessorRequest request) {
        try {
            MatchAssessorResponse assessor = matchAssessorService.updateAssessor(assessorId, request);
            return ResponseEntity.ok(ResponseUtils.success("Assessor updated successfully", assessor));
        } catch (Exception e) {
            log.error("Error updating assessor {}", assessorId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "UPDATE_ASSESSOR_ERROR"));
        }
    }

    /**
     * Get all assessors for a match
     */
    @GetMapping("/match/{matchId}")
    public ResponseEntity<BaseResponse<List<MatchAssessorResponse>>> getAssessorsByMatchId(
            @PathVariable String matchId) {
        try {
            List<MatchAssessorResponse> assessors = matchAssessorService.getAssessorsByMatchId(matchId);
            return ResponseEntity.ok(ResponseUtils.success("Assessors retrieved successfully", assessors));
        } catch (Exception e) {
            log.error("Error fetching assessors for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to fetch assessors", "FETCH_ASSESSORS_ERROR"));
        }
    }

    /**
     * Get assessor by ID
     */
    @GetMapping("/{assessorId}")
    public ResponseEntity<BaseResponse<MatchAssessorResponse>> getAssessorById(
            @PathVariable String assessorId) {
        try {
            MatchAssessorResponse assessor = matchAssessorService.getAssessorById(assessorId);
            return ResponseEntity.ok(ResponseUtils.success("Assessor retrieved successfully", assessor));
        } catch (Exception e) {
            log.error("Error fetching assessor {}", assessorId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to fetch assessor", "FETCH_ASSESSOR_ERROR"));
        }
    }

    /**
     * Get assessors by user ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<BaseResponse<List<MatchAssessorResponse>>> getAssessorsByUserId(
            @PathVariable String userId) {
        try {
            List<MatchAssessorResponse> assessors = matchAssessorService.getAssessorsByUserId(userId);
            return ResponseEntity.ok(ResponseUtils.success("Assessors retrieved successfully", assessors));
        } catch (Exception e) {
            log.error("Error fetching assessors for user {}", userId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to fetch assessors", "FETCH_ASSESSORS_ERROR"));
        }
    }

    /**
     * Remove an assessor from a match
     */
    @DeleteMapping("/{assessorId}")
    public ResponseEntity<BaseResponse<Void>> removeAssessor(@PathVariable String assessorId) {
        try {
            matchAssessorService.removeAssessor(assessorId);
            return ResponseEntity.ok(ResponseUtils.success("Assessor removed successfully"));
        } catch (Exception e) {
            log.error("Error removing assessor {}", assessorId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "REMOVE_ASSESSOR_ERROR"));
        }
    }

    /**
     * Remove all assessors from a match
     */
    @DeleteMapping("/match/{matchId}")
    public ResponseEntity<BaseResponse<Void>> removeAllAssessors(@PathVariable String matchId) {
        try {
            matchAssessorService.removeAllAssessors(matchId);
            return ResponseEntity.ok(ResponseUtils.success("All assessors removed successfully"));
        } catch (Exception e) {
            log.error("Error removing all assessors from match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "REMOVE_ALL_ASSESSORS_ERROR"));
        }
    }
}


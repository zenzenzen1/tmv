package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.request.AssignAssessorRequest;
import sep490g65.fvcapi.dto.request.AssignMatchAssessorsRequest;
import sep490g65.fvcapi.dto.request.AssignPerformanceAssessorsRequest;
import sep490g65.fvcapi.dto.request.CreateMatchAssessorRequest;
import sep490g65.fvcapi.dto.request.UpdateMatchAssessorRequest;
import org.springframework.security.core.Authentication;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.MatchAssessorResponse;
import sep490g65.fvcapi.dto.response.MyAssignedMatchResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.service.MatchAssessorService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/match-assessors")
@RequiredArgsConstructor
@Slf4j
public class MatchAssessorController {

    private final MatchAssessorService matchAssessorService;
    private final UserRepository userRepository;

    /**
     * List available assessors (teachers) that can be assigned.
     */
    @GetMapping("/available")
    public ResponseEntity<BaseResponse<List<UserResponse>>> listAvailableAssessors() {
        List<UserResponse> assessors = matchAssessorService.listAvailableAssessors();
        return ResponseEntity.ok(ResponseUtils.success("Available assessors retrieved successfully", assessors));
    }

    /**
     * List assessors by competition (legacy, currently returns empty list).
     */
    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<BaseResponse<List<MatchAssessorResponse>>> listByCompetition(
            @PathVariable String competitionId) {
        List<MatchAssessorResponse> assessors = matchAssessorService.listByCompetition(competitionId);
        return ResponseEntity.ok(ResponseUtils.success("Assessors retrieved successfully", assessors));
    }

    /**
     * List assessors by competition & specialization (legacy, currently returns empty list).
     */
    @GetMapping("/competition/{competitionId}/specialization/{specialization}")
    public ResponseEntity<BaseResponse<List<MatchAssessorResponse>>> listByCompetitionAndSpecialization(
            @PathVariable String competitionId,
            @PathVariable MatchAssessor.Specialization specialization) {
        List<MatchAssessorResponse> assessors = matchAssessorService
                .listByCompetitionAndSpecialization(competitionId, specialization);
        return ResponseEntity.ok(ResponseUtils.success("Assessors retrieved successfully", assessors));
    }

    /**
     * List assignments for current authenticated assessor (compact view).
     */
    @GetMapping("/my-assignments/detail")
    public ResponseEntity<BaseResponse<List<MatchAssessorResponse>>> getMyAssignments(
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseUtils.error("Unauthorized", "UNAUTHORIZED"));
        }

        String email = authentication.getName();
        var currentUser = userRepository.findByPersonalMailIgnoreCase(email)
                .orElse(null);
        if (currentUser == null) {
            return ResponseEntity.ok(ResponseUtils.success("No assignments found", List.of()));
        }

        List<MatchAssessorResponse> assignments = matchAssessorService.listByUserId(currentUser.getId());
        return ResponseEntity.ok(ResponseUtils.success("Assessor assignments retrieved successfully", assignments));
    }

    /**
     * Assign a single assessor to a performance/match (legacy single assign endpoint).
     */
    @PostMapping("/assign/single")
    public ResponseEntity<BaseResponse<MatchAssessorResponse>> assignAssessor(
            @Valid @RequestBody AssignAssessorRequest request,
            Authentication authentication) {
        String assignedByUserId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            var currentUser = userRepository.findByPersonalMailIgnoreCase(email).orElse(null);
            if (currentUser != null) {
                assignedByUserId = currentUser.getId();
            }
        }

        MatchAssessorResponse response = matchAssessorService.assignAssessor(request, assignedByUserId);
        return ResponseEntity.ok(ResponseUtils.success("Assessor assigned successfully", response));
    }

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
     * Assign multiple assessors to a performance match (Quyền/Võ nhạc) at once.
     */
    @PostMapping("/assign/performance")
    public ResponseEntity<BaseResponse<List<MatchAssessorResponse>>> assignPerformanceAssessors(
            @Valid @RequestBody AssignPerformanceAssessorsRequest request,
            Authentication authentication) {
        try {
            String assignedByUserId = null;
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                var user = userRepository.findByPersonalMailIgnoreCase(email)
                        .orElseGet(() -> userRepository.findByEduMailIgnoreCase(email).orElse(null));
                if (user != null) {
                    assignedByUserId = user.getId();
                }
            }

            List<MatchAssessorResponse> assessors = matchAssessorService.assignPerformanceAssessors(request, assignedByUserId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success("Assessors assigned successfully", assessors));
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found while assigning performance assessors: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseUtils.error(e.getMessage(), "NOT_FOUND"));
        } catch (BusinessException e) {
            log.error("Business error while assigning performance assessors: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseUtils.error(e.getMessage(), e.getErrorCode()));
        } catch (Exception e) {
            log.error("Error assigning assessors to performance match {}", request.getPerformanceMatchId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to assign assessors", "ASSIGN_PERFORMANCE_ASSESSORS_ERROR"));
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

    /**
     * Get my assigned matches (for current authenticated user)
     */
    @GetMapping({"/my-assignments", "/my-assigned-matches"})
    public ResponseEntity<BaseResponse<List<MyAssignedMatchResponse>>> getMyAssignedMatches(
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseUtils.error("Unauthorized", "UNAUTHORIZED"));
            }

            String email = authentication.getName();
            var user = userRepository.findAllByPersonalMailIgnoreCase(email).stream().findFirst()
                    .orElseGet(() -> userRepository.findAllByEduMailIgnoreCase(email).stream().findFirst().orElse(null));

            if (user == null) {
                return ResponseEntity.ok(ResponseUtils.success("No assignments found", List.of()));
            }

            List<MyAssignedMatchResponse> matches = matchAssessorService.getMyAssignedMatches(user.getId());
            return ResponseEntity.ok(ResponseUtils.success("Assigned matches retrieved successfully", matches));
        } catch (RuntimeException e) {
            log.error("Failed to fetch assessor: {}", e.getMessage(), e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to fetch assessor", "API_ERROR"));
        } catch (Exception e) {
            log.error("Error fetching assigned matches for current user", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to fetch assigned matches", "FETCH_MY_ASSIGNMENTS_ERROR"));
        }
    }
}


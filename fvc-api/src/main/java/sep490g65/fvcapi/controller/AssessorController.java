package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.request.AssignAssessorRequest;
import sep490g65.fvcapi.dto.response.AssessorResponse;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.entity.Assessor;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.AssessorService;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/assessors")
@RequiredArgsConstructor
public class AssessorController {

    private final AssessorService assessorService;
    private final UserRepository userRepository;

    @GetMapping("/available")
    public ResponseEntity<BaseResponse<List<UserResponse>>> listAvailableAssessors() {
        List<UserResponse> assessors = assessorService.listAvailableAssessors();
        return ResponseEntity.ok(BaseResponse.success("Available assessors retrieved successfully", assessors));
    }

    @GetMapping("/my-assignments")
    public ResponseEntity<BaseResponse<List<AssessorResponse>>> getMyAssignments(
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(BaseResponse.error("Unauthorized", "UNAUTHORIZED"));
        }
        
        String email = authentication.getName();
        User currentUser = userRepository.findByPersonalMailIgnoreCase(email)
                .orElse(null);
        
        if (currentUser == null) {
            return ResponseEntity.ok(BaseResponse.success("No assignments found", List.of()));
        }
        
        List<AssessorResponse> assignments = assessorService.listByUserId(currentUser.getId());
        return ResponseEntity.ok(BaseResponse.success("Assessor assignments retrieved successfully", assignments));
    }

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<BaseResponse<List<AssessorResponse>>> listByCompetition(
            @PathVariable String competitionId) {
        List<AssessorResponse> assessors = assessorService.listByCompetition(competitionId);
        return ResponseEntity.ok(BaseResponse.success("Assessors retrieved successfully", assessors));
    }

    @GetMapping("/competition/{competitionId}/specialization/{specialization}")
    public ResponseEntity<BaseResponse<List<AssessorResponse>>> listByCompetitionAndSpecialization(
            @PathVariable String competitionId,
            @PathVariable Assessor.Specialization specialization) {
        List<AssessorResponse> assessors = assessorService.listByCompetitionAndSpecialization(competitionId, specialization);
        return ResponseEntity.ok(BaseResponse.success("Assessors retrieved successfully", assessors));
    }

    @PostMapping("/assign")
    public ResponseEntity<BaseResponse<AssessorResponse>> assignAssessor(
            @Valid @RequestBody AssignAssessorRequest request,
            Authentication authentication) {
        // Get current user ID from authentication (email -> userId)
        String assignedByUserId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            User currentUser = userRepository.findByPersonalMailIgnoreCase(email).orElse(null);
            if (currentUser != null) {
                assignedByUserId = currentUser.getId();
            }
        }
        
        AssessorResponse response = assessorService.assignAssessor(request, assignedByUserId);
        return ResponseEntity.ok(BaseResponse.success("Assessor assigned successfully", response));
    }

    @DeleteMapping("/{assessorId}")
    public ResponseEntity<BaseResponse<Void>> unassignAssessor(@PathVariable String assessorId) {
        assessorService.unassignAssessor(assessorId);
        return ResponseEntity.ok(BaseResponse.success("Assessor unassigned successfully"));
    }
}


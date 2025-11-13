package sep490g65.fvcapi.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.MatchAssessor;

import java.util.List;

/**
 * Request payload for bulk assigning assessors to a performance match (Quyền/Võ nhạc).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignPerformanceAssessorsRequest {

    /**
     * Optional performance ID - useful for creating competition roles.
     */
    private String performanceId;

    /**
     * Required performance match ID that assessors will be attached to.
     */
    @NotBlank(message = "Performance match ID is required")
    private String performanceMatchId;

    /**
     * Specialization of the assessors (QUYEN / MUSIC).
     */
    @NotNull(message = "Specialization is required")
    private MatchAssessor.Specialization specialization;

    /**
     * The assessors to assign.
     */
    @NotNull(message = "Assignments are required")
    @Size(min = 1, max = 6, message = "Must assign between 1 and 6 assessors")
    @Valid
    private List<Assignment> assignments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Assignment {

        @NotBlank(message = "User ID is required")
        private String userId;

        @NotNull(message = "Position is required")
        private Integer position; // 1-based position
    }
}



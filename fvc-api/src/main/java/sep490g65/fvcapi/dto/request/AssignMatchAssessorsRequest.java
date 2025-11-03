package sep490g65.fvcapi.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignMatchAssessorsRequest {
    @NotBlank(message = "Match ID is required")
    private String matchId;

    @NotNull(message = "Assessors list is required")
    @Size(min = 1, max = 6, message = "Must assign between 1 and 6 assessors")
    @Valid
    private List<AssessorAssignment> assessors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssessorAssignment {
        @NotBlank(message = "User ID is required")
        private String userId;

        @NotNull(message = "Position is required")
        private Integer position; // 1-6

        @NotNull(message = "Role is required")
        private sep490g65.fvcapi.enums.AssessorRole role;

        private String notes;
    }
}


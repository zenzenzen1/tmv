package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.AssessorRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMatchAssessorRequest {
    @NotBlank(message = "Match ID is required")
    private String matchId;

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotNull(message = "Position is required")
    @Min(value = 1, message = "Position must be between 1 and 6")
    @Max(value = 6, message = "Position must be between 1 and 6")
    private Integer position;

    @NotNull(message = "Role is required")
    private AssessorRole role;

    private String notes;
}


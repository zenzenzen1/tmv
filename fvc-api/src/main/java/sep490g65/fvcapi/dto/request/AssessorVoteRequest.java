package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.Corner;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessorVoteRequest {
    @NotBlank(message = "Match ID is required")
    private String matchId;
    
    @NotBlank(message = "Assessor ID is required")
    private String assessorId;
    
    @NotNull(message = "Corner is required")
    private Corner corner;
    
    @NotNull(message = "Score is required")
    @Min(value = 1, message = "Score must be at least 1")
    private Integer score; // 1 or 2
}


package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Assessor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignAssessorRequest {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    @NotNull(message = "Specialization is required")
    private Assessor.Specialization specialization;
}


package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.AssessorRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMatchAssessorRequest {
    private String userId;
    
    @Min(value = 1, message = "Position must be between 1 and 6")
    @Max(value = 6, message = "Position must be between 1 and 6")
    private Integer position;
    
    private AssessorRole role;
    
    private String notes;
}


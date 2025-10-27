package sep490g65.fvcapi.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitScoreRequest {
    
    @NotBlank(message = "Performance ID is required")
    private String performanceId;
    
    @NotBlank(message = "Assessor ID is required")
    private String assessorId;
    
    @NotNull(message = "Score is required")
    @DecimalMin(value = "0.0", message = "Score must be at least 0.0")
    @DecimalMax(value = "10.0", message = "Score must be at most 10.0")
    private BigDecimal score;
    
    private String criteriaScores;  // JSON string
    
    private String notes;
}

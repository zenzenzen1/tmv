package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Athlete;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAthletesStatusRequest {
    
    @NotEmpty(message = "Athlete IDs list cannot be empty")
    private List<String> athleteIds;
    
    @NotNull(message = "Status is required")
    private Athlete.AthleteStatus status;
}


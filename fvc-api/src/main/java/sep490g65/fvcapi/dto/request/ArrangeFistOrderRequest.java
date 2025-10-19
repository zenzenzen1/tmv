package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Athlete;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArrangeFistOrderRequest {
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    @NotBlank(message = "Competition Type is required")
    private Athlete.CompetitionType competitionType;
    

}

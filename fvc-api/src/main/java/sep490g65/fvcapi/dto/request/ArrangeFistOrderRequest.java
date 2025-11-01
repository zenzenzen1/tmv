package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArrangeFistOrderRequest {
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    @NotBlank(message = "Competition Type is required")
    private String competitionType;
    
    @NotNull(message = "Athlete orders are required")
    private List<AthleteOrder> orders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AthleteOrder {
        private String athleteId;
        private Integer orderIndex;
    }

}

package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArrangeFistOrderRequest {
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    @NotBlank(message = "Competition Type is required")
    private String competitionType;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AthleteOrder {
        @NotBlank(message = "Athlete ID is required")
        private String athleteId;
        
        @NotNull(message = "Order is required")
        private Integer order;
    }
}

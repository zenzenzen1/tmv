package sep490g65.fvcapi.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArrangeFistOrderRequest {
    
    @NotBlank(message = "Tournament ID is required")
    private String tournamentId;
    
    @NotBlank(message = "Content ID is required")
    private String contentId;
    
    @NotNull(message = "Athlete orders are required")
    private List<AthleteOrder> athleteOrders;
    
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

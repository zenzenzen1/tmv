package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCompetitionOrderRequest {
    
    @NotNull(message = "Competition ID is required")
    private String competitionId;

    @NotNull(message = "Order index is required")
    private Integer orderIndex;

    private String contentSelectionId; // Optional: for scoping by specific content
}

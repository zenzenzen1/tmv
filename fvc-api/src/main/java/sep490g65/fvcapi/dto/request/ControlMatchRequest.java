package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.MatchControlAction;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ControlMatchRequest {
    
    @NotBlank(message = "Match ID is required")
    private String matchId;
    
    @NotNull(message = "Action is required")
    private MatchControlAction action;
    
    private Integer currentRound;
}


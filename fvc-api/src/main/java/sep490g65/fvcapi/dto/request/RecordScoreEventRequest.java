package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.Corner;
import sep490g65.fvcapi.enums.MatchEventType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordScoreEventRequest {
    
    @NotBlank(message = "Match ID is required")
    private String matchId;
    
    @NotNull(message = "Round is required")
    @Min(value = 1, message = "Round must be at least 1")
    private Integer round;
    
    @NotNull(message = "Timestamp in round seconds is required")
    @Min(value = 0, message = "Timestamp cannot be negative")
    private Integer timestampInRoundSeconds;
    
    @NotNull(message = "Corner is required")
    private Corner corner;
    
    @NotNull(message = "Event type is required")
    private MatchEventType eventType;
    
    private String judgeId;
    
    /**
     * Comma-separated list of assessor IDs who voted/agreed on this event
     * For consensus scoring, contains all assessors who voted for the same score
     */
    private String assessorIds;
}


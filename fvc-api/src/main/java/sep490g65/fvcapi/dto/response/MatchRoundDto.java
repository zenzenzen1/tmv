package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchRoundDto {
    private String id;
    private String matchId;
    private Integer roundNumber;
    private String roundType; // MAIN or TIEBREAKER
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer redScore;
    private Integer blueScore;
    private Integer durationSeconds;
    private Integer scheduledDurationSeconds;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


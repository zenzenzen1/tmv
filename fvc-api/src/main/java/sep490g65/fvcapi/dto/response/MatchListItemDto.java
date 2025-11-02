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
public class MatchListItemDto {
    private String id;
    private String competitionId;
    private String weightClassId;
    private String roundType;
    private String redAthleteId;
    private String blueAthleteId;
    private String redAthleteName;
    private String blueAthleteName;
    private String redAthleteUnit;
    private String blueAthleteUnit;
    private String status;
    private Integer currentRound;
    private Integer totalRounds;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}


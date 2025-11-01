package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchScoreboardDto {
    private String matchId;
    private String matchName;
    private String weightClass;
    private String roundType;
    private Integer currentRound;
    private Integer totalRounds;
    private Integer roundDurationSeconds;
    private Integer timeRemainingSeconds;
    private String status;
    private MatchAthleteInfoDto redAthlete;
    private MatchAthleteInfoDto blueAthlete;
}


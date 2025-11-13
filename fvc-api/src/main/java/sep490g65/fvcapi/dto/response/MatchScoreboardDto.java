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
    private String field;
    private String roundType;
    private Integer currentRound;
    private Integer totalRounds;
    private Integer roundDurationSeconds; // Duration for current round
    private Integer mainRoundDurationSeconds; // Duration for main rounds (hiệp chính)
    private Integer tiebreakerDurationSeconds; // Duration for tiebreaker rounds (hiệp phụ)
    private String status;
    private String scheduledStartTime; // Giờ bắt đầu dự kiến (ISO format)
    private Boolean redAthletePresent; // Xác nhận vận động viên đỏ có mặt
    private Boolean blueAthletePresent; // Xác nhận vận động viên xanh có mặt
    private MatchAthleteInfoDto redAthlete;
    private MatchAthleteInfoDto blueAthlete;
}


package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchAthleteInfoDto {
    private String id;
    private String name;
    private String unit;
    private String sbtNumber;
    private Integer score;
    private Integer medicalTimeoutCount;
    private Integer warningCount;
}


package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.Corner;
import sep490g65.fvcapi.enums.MatchEventType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchEventDto {
    private String id;
    private Integer round;
    private Integer timestampInRoundSeconds;
    private String judgeId;
    private Corner corner;
    private MatchEventType eventType;
    private String description;
    private LocalDateTime createdAt;
}


package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.Corner;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessorVoteResponse {
    private String matchId;
    private Corner corner;
    private Integer score;
    private Integer voteCount; // Số giám định đã vote
    private Integer totalAssessors; // Tổng số giám định
    private boolean scoreAccepted; // true nếu >= 3/5 giám định đồng ý
    private Map<String, Integer> votes; // Map assessorId -> score (1 or 2) đã vote
}


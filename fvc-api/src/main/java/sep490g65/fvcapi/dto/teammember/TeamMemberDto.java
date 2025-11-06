package sep490g65.fvcapi.dto.teammember;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {
    private String id;
    private String teamId;
    private String userId;
    private String status; // ACTIVE | REMOVED
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
}



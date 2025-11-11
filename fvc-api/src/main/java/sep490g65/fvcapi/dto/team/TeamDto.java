package sep490g65.fvcapi.dto.team;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamDto {
    private String id;
    private String cycleId;
    private String code;
    private String name;
    private String description;
}



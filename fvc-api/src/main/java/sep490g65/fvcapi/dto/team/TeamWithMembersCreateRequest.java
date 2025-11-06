package sep490g65.fvcapi.dto.team;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import sep490g65.fvcapi.dto.teammember.TeamMemberAddRequest;

import java.util.ArrayList;
import java.util.List;

@Data
public class TeamWithMembersCreateRequest {
    @NotNull
    @Valid
    private TeamCreateRequest team;

    @Valid
    private List<TeamMemberAddRequest> members = new ArrayList<>();
}


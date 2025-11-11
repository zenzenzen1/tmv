package sep490g65.fvcapi.dto.cycle;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import sep490g65.fvcapi.dto.phase.ChallengePhaseCreateRequest;
import sep490g65.fvcapi.dto.team.TeamWithMembersCreateRequest;

import java.util.ArrayList;
import java.util.List;

@Data
public class ChallengeCycleBulkCreateRequest {
    @NotNull
    @Valid
    private ChallengeCycleCreateRequest cycle;

    @Valid
    private List<ChallengePhaseCreateRequest> phases = new ArrayList<>();

    @Valid
    private List<TeamWithMembersCreateRequest> teams = new ArrayList<>();
}


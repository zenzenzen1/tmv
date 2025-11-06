package sep490g65.fvcapi.dto.teammember;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TeamMemberAddRequest {
    @NotBlank
    private String userId;

    private String note;
}



package sep490g65.fvcapi.dto.teammember;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class TeamMemberBulkAddRequest {
    @NotEmpty
    private List<String> userIds;

    private String note;
}



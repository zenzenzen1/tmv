package sep490g65.fvcapi.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TeamCreateRequest {
    @NotBlank
    @Size(min = 1, max = 10)
    private String code;

    @Size(max = 100)
    private String name;

    @Size(max = 2000)
    private String description;
}



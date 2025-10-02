package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateMusicContentRequest {
    @NotBlank
    private String name;
    private String description;
    private Boolean isActive;
}



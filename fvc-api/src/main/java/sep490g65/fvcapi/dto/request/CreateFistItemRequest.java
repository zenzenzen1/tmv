package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFistItemRequest {
    @NotBlank
    private String name;
    private String description;
    private String parentId; // optional, to support nested items
}



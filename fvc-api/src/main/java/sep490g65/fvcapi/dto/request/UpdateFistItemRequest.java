package sep490g65.fvcapi.dto.request;

import lombok.Data;

@Data
public class UpdateFistItemRequest {
    private String name;
    private String description;
    private String parentId;
}



package sep490g65.fvcapi.dto.request;

import lombok.Data;

@Data
public class UpdateMusicContentRequest {
    private String name;
    private String description;
    private Boolean isActive;
}



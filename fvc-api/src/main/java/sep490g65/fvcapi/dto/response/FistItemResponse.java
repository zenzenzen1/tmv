package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FistItemResponse {
    private String id;
    private String name;
    private String description;
    private Integer level;
    private Integer participantsPerEntry;
    private String configId;
    private String configName;
}

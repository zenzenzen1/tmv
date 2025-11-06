package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldResponse {
    private String id;
    private String location;
    private Boolean isUsed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


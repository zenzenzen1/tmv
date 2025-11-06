package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SavePerformanceMatchSetupRequest {
    private LocalDateTime scheduledTime; // optional

    @Min(0)
    private Integer durationSeconds; // optional

    // Optional denormalized filter fields to persist with PerformanceMatch
    private String fistConfigId;   // for QUYEN
    private String fistItemId;     // for QUYEN
    private String musicContentId; // for MUSIC
}



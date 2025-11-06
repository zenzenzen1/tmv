package sep490g65.fvcapi.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Performance;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePerformanceMatchRequest {
    private String competitionId;
    private String performanceId;
    private Integer matchOrder;
    private LocalDateTime scheduledTime;
    private Performance.ContentType contentType;
    private String notes;
}


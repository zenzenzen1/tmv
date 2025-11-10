package sep490g65.fvcapi.dto.training;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.TrainingSessionStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingSessionListDto {
    private String id;
    private String title;
    private String cycleName;
    private String teamName;
    private String phaseName;
    private String locationName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer capacity;
    private TrainingSessionStatus status;
}



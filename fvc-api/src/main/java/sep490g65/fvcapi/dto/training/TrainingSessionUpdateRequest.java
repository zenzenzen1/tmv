package sep490g65.fvcapi.dto.training;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.TrainingSessionStatus;

import java.time.LocalDateTime;

@Data
public class TrainingSessionUpdateRequest {
    @Size(min = 1, max = 150)
    private String title;

    @Size(max = 500)
    private String description;

    private String teamId;

    private String phaseId;

    private String locationId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Min(value = 0, message = "Capacity must be >= 0")
    private Integer capacity;

    private TrainingSessionStatus status;

    @AssertTrue(message = "endTime must be after startTime (if both provided)")
    public boolean isValidTimeRange() {
        if (startTime == null || endTime == null) return true;
        return endTime.isAfter(startTime);
    }
}



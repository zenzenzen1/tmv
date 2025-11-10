package sep490g65.fvcapi.dto.training;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.TrainingSessionStatus;

import java.time.LocalDateTime;

@Data
public class TrainingSessionCreateRequest {
    @NotBlank
    @Size(min = 1, max = 150)
    private String title;

    @Size(max = 500)
    private String description;

    @NotNull
    private String cycleId;

    private String teamId; // Optional

    private String phaseId; // Optional

    private String locationId; // Optional

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    @Min(value = 0, message = "Capacity must be >= 0")
    private Integer capacity;

    private TrainingSessionStatus status = TrainingSessionStatus.PLANNED;

    @AssertTrue(message = "endTime must be after startTime")
    public boolean isValidTimeRange() {
        if (startTime == null || endTime == null) return true;
        return endTime.isAfter(startTime);
    }
}



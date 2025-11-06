package sep490g65.fvcapi.dto.phase;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.PhaseStatus;

import java.time.LocalDate;

@Data
public class ChallengePhaseUpdateRequest {
    @NotBlank
    @Size(min = 2, max = 150)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    private PhaseStatus status;

    @Min(value = 0, message = "order must be >= 0")
    private Integer order;

    @AssertTrue(message = "endDate must be on or after startDate")
    public boolean isValidDateRange() {
        if (startDate == null || endDate == null) return true;
        return !endDate.isBefore(startDate);
    }
}



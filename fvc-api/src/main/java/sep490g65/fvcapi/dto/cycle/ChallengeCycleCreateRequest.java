package sep490g65.fvcapi.dto.cycle;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;

import java.time.LocalDate;

@Data
public class ChallengeCycleCreateRequest {
    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate; // Optional - sẽ được tính từ startDate + cycleDurationMonths

    @NotNull
    private Integer cycleDurationMonths; // Số tháng của cycle

    @NotNull
    private Integer phaseDurationWeeks; // Số tuần của mỗi phase

    @NotNull
    private ChallengeCycleStatus status;

    @AssertTrue(message = "endDate must be on or after startDate (if provided)")
    public boolean isValidDateRange() {
        if (startDate == null) return true;
        if (endDate != null) {
            return !endDate.isBefore(startDate);
        }
        return true; // endDate sẽ được tính tự động
    }

    @AssertTrue(message = "cycleDurationMonths must be positive")
    public boolean isValidCycleDuration() {
        return cycleDurationMonths == null || cycleDurationMonths > 0;
    }

    @AssertTrue(message = "phaseDurationWeeks must be positive")
    public boolean isValidPhaseDuration() {
        return phaseDurationWeeks == null || phaseDurationWeeks > 0;
    }
}



package sep490g65.fvcapi.dto.cycle;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;

import java.time.LocalDate;

@Data
public class ChallengeCycleUpdateRequest {
    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate; // Optional - sẽ được tính từ startDate + cycleDurationMonths

    private Integer cycleDurationMonths; // Số tháng của cycle

    private Integer phaseDurationWeeks; // Số tuần của mỗi phase

    @NotNull
    private ChallengeCycleStatus status;

    // Tiêu chí đánh giá mặc định cho cycle
    @Min(value = 0, message = "trainSessionsRequired must be >= 0")
    private Integer trainSessionsRequired; // Số buổi tập bắt buộc mỗi phase

    @Min(value = 0, message = "eventsRequired must be >= 0")
    private Integer eventsRequired; // Số event tham gia bắt buộc mỗi phase

    @AssertTrue(message = "endDate must be on or after startDate (if provided)")
    public boolean isValidDateRange() {
        if (startDate == null) return true;
        if (endDate != null) {
            return !endDate.isBefore(startDate);
        }
        return true; // endDate sẽ được tính tự động nếu có cycleDurationMonths
    }

    @AssertTrue(message = "cycleDurationMonths must be positive (if provided)")
    public boolean isValidCycleDuration() {
        return cycleDurationMonths == null || cycleDurationMonths > 0;
    }

    @AssertTrue(message = "phaseDurationWeeks must be positive (if provided)")
    public boolean isValidPhaseDuration() {
        return phaseDurationWeeks == null || phaseDurationWeeks > 0;
    }
}



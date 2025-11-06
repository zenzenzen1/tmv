package sep490g65.fvcapi.dto.cycle;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;

import java.time.LocalDate;

@Data
public class ChallengeCycleCreateRequest {
    @NotBlank
    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    private ChallengeCycleStatus status;
}



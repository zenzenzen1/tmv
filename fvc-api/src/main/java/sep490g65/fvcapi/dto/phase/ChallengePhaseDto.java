package sep490g65.fvcapi.dto.phase;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.PhaseStatus;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengePhaseDto {
    private String id;
    private String cycleId;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private PhaseStatus status;
    private Integer order;
}



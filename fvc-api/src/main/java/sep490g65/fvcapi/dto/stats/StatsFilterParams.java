package sep490g65.fvcapi.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsFilterParams {
    private String cycleId;
    private String phaseId;
    private String teamId;
    private String dateFrom;
    private String dateTo;
}



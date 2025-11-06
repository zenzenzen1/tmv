package sep490g65.fvcapi.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsExportRequest {
    private StatsFilterParams filters;
    private String format; // CSV or XLSX
}



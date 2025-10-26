package sep490g65.fvcapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.DrawType;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DrawRequest {
    private String competitionId;
    private String weightClassId;
    private DrawType drawType;
    private List<AthleteSeed> athleteSeeds;
    private String notes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AthleteSeed {
        private String athleteId;
        private String athleteName;
        private String athleteClub;
        private Integer seedNumber;
    }
}

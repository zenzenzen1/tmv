package sep490g65.fvcapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.DrawType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DrawResponse {
    private String drawSessionId;
    private String competitionId;
    private String weightClassId;
    private DrawType drawType;
    private String drawnBy;
    private LocalDateTime drawDate;
    private Boolean isFinal;
    private String notes;
    private List<DrawResult> results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DrawResult {
        private String athleteId;
        private String athleteName;
        private String athleteClub;
        private Integer seedNumber;
    }
}

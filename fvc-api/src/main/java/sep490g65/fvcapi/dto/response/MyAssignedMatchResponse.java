package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.AssessorRole;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyAssignedMatchResponse {
    private String assessorId;
    private String matchId;
    private String performanceMatchId;
    private String performanceId;
    private AssessorRole role;
    private Integer position;
    private String notes;
    
    // Match info (for fighting matches)
    private MatchInfo match;
    
    // Performance match info (for quyen/music)
    private PerformanceMatchInfo performanceMatch;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchInfo {
        private String id;
        private String competitionId;
        private String competitionName;
        private String redAthleteName;
        private String blueAthleteName;
        private String status;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceMatchInfo {
        private String id;
        private String competitionId;
        private String competitionName;
        private String performanceId;
        private String contentName;
        private String contentType; // QUYEN, MUSIC
        private Integer matchOrder;
        private String status;
        private String participants; // Comma-separated names
    }
}


package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.entity.Assessor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceResponse {
    
    private String id;
    private String competitionId;
    private String competitionName;
    
    private Boolean isTeam;
    private String teamId;
    private String teamName;
    private Integer participantsPerEntry;
    
    private Performance.PerformanceType performanceType;
    private Performance.ContentType contentType;
    private String contentId;
    // Denormalized content identifiers
    private String fistConfigId;
    private String fistItemId;
    private String musicContentId;
    
    private Performance.PerformanceStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal totalScore;
    
    private List<AthleteInfo> athletes;
    private List<AssessorInfo> assessors;
    private List<ScoreInfo> scores;
    
    private BigDecimal averageScore;
    private Integer assessorCount;
    private Integer remainingAssessors;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AthleteInfo {
        private String id;
        private String fullName;
        private String email;
        // removed teamPosition/isCaptain in new spec
        private Boolean approved; // true nếu đã có athlete id
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssessorInfo {
        private String id;
        private String fullName;
        private String email;
        private Assessor.Specialization specialization;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreInfo {
        private String id;
        private String assessorId;
        private String assessorName;
        private BigDecimal score;
        private String criteriaScores;
        private String notes;
        private LocalDateTime submittedAt;
    }
}
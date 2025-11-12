package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.entity.PerformanceAthlete;
import sep490g65.fvcapi.entity.PerformanceMatch;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceMatchResponse {
    private String id;
    private String competitionId;
    private String competitionName;
    private String performanceId;
    private Integer matchOrder;
    private LocalDateTime scheduledTime;
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;
    private Performance.ContentType contentType;
    private PerformanceMatch.MatchStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Added for FE display when saving setup
    private Boolean isTeam;
    private String teamName;
    private String contentId;
    private String fistConfigId;   // for Quyền filtering
    private String fistItemId;     // for Quyền filtering
    private String musicContentId; // for Võ nhạc filtering
    private Integer durationSeconds; // planned timer
    private String fieldId;
    private String fieldLocation;
    private List<SelectedAthlete> selectedAthletes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SelectedAthlete {
        private String id;         // UUID as String if present
        private String fullName;   // fallback to tempFullName if athlete is null
    }

    public static PerformanceMatchResponse from(PerformanceMatch performanceMatch) {
        if (performanceMatch == null) return null;
        
        return PerformanceMatchResponse.builder()
                .id(performanceMatch.getId())
                .competitionId(performanceMatch.getCompetition().getId())
                .competitionName(performanceMatch.getCompetition().getName())
                .performanceId(performanceMatch.getPerformance().getId())
                .matchOrder(performanceMatch.getMatchOrder())
                .scheduledTime(performanceMatch.getScheduledTime())
                .actualStartTime(performanceMatch.getActualStartTime())
                .actualEndTime(performanceMatch.getActualEndTime())
                .contentType(performanceMatch.getContentType())
                .status(performanceMatch.getStatus())
                .notes(performanceMatch.getNotes())
                .createdAt(performanceMatch.getCreatedAt())
                .updatedAt(performanceMatch.getUpdatedAt())
                .isTeam(performanceMatch.getPerformance().getIsTeam())
                .teamName(performanceMatch.getPerformance().getTeamName())
                .contentId(performanceMatch.getPerformance().getContentId())
                .fistConfigId(performanceMatch.getFistConfigId())
                .fistItemId(performanceMatch.getFistItemId())
                .musicContentId(performanceMatch.getMusicContentId())
                .durationSeconds(performanceMatch.getDurationSeconds())
                .fieldId(performanceMatch.getFieldId())
                .fieldLocation(performanceMatch.getFieldLocation())
                .build();
    }

    // Overload including athletes list for display
    public static PerformanceMatchResponse from(PerformanceMatch performanceMatch, List<PerformanceAthlete> athletes) {
        PerformanceMatchResponse base = from(performanceMatch);
        if (base == null) return null;
        List<SelectedAthlete> mapped = athletes == null ? java.util.List.of() : athletes.stream()
                .map(pa -> SelectedAthlete.builder()
                        .id(pa.getAthlete() != null && pa.getAthlete().getId() != null ? pa.getAthlete().getId().toString() : null)
                        .fullName(pa.getAthlete() != null ? pa.getAthlete().getFullName() : pa.getTempFullName())
                        .build())
                .collect(Collectors.toList());
        base.setSelectedAthletes(mapped);
        return base;
    }
}


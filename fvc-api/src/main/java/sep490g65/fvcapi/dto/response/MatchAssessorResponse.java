package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.enums.AssessorRole;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchAssessorResponse {
    private String id;
    private String matchId;
    private String performanceId;
    private String performanceMatchId;
    private String competitionId;
    private String userId;
    private String userFullName;
    private String userEmail;
    private Integer position;
    private AssessorRole role;
    private MatchAssessor.Specialization specialization;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MatchAssessorResponse from(MatchAssessor assessor) {
        if (assessor == null) {
            return null;
        }

        String resolvedCompetitionId = null;
        if (assessor.getPerformance() != null && assessor.getPerformance().getCompetition() != null) {
            resolvedCompetitionId = assessor.getPerformance().getCompetition().getId();
        } else if (assessor.getPerformanceMatch() != null && assessor.getPerformanceMatch().getCompetition() != null) {
            resolvedCompetitionId = assessor.getPerformanceMatch().getCompetition().getId();
        } else if (assessor.getMatch() != null) {
            resolvedCompetitionId = assessor.getMatch().getCompetitionId();
        }

        return MatchAssessorResponse.builder()
                .id(assessor.getId())
                .matchId(assessor.getMatch() != null ? assessor.getMatch().getId() : null)
                .performanceId(assessor.getPerformance() != null ? assessor.getPerformance().getId() : null)
                .performanceMatchId(assessor.getPerformanceMatch() != null ? assessor.getPerformanceMatch().getId() : null)
                .competitionId(resolvedCompetitionId)
                .userId(assessor.getUser() != null ? assessor.getUser().getId() : null)
                .userFullName(assessor.getUser() != null ? assessor.getUser().getFullName() : null)
                .userEmail(assessor.getUser() != null
                        ? (assessor.getUser().getEduMail() != null ? assessor.getUser().getEduMail() : assessor.getUser().getPersonalMail())
                        : null)
                .position(assessor.getPosition())
                .role(assessor.getRole())
                .specialization(assessor.getSpecialization())
                .notes(assessor.getNotes())
                .createdAt(assessor.getCreatedAt())
                .updatedAt(assessor.getUpdatedAt())
                .build();
    }
}


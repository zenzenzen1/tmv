package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Assessor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessorResponse {
    private String id;
    private String userId;
    private String fullName;
    private String email;
    private String competitionId;
    private String performanceId;
    private String performanceMatchId;
    private String matchId;
    private Assessor.Specialization specialization;
    private Assessor.MatchRole role;
    private Integer position;
    private String notes;

    public static AssessorResponse from(Assessor assessor) {
        if (assessor == null) return null;
        
        String competitionId = null;
        if (assessor.getPerformance() != null) {
            competitionId = assessor.getPerformance().getCompetition().getId();
        } else if (assessor.getPerformanceMatch() != null) {
            competitionId = assessor.getPerformanceMatch().getCompetition().getId();
        }
        
        return AssessorResponse.builder()
                .id(assessor.getId())
                .userId(assessor.getUser().getId())
                .fullName(assessor.getUser().getFullName())
                .email(assessor.getUser().getPersonalMail() != null ? assessor.getUser().getPersonalMail() : assessor.getUser().getEduMail())
                .competitionId(competitionId)
                .performanceId(assessor.getPerformance() != null ? assessor.getPerformance().getId() : null)
                .performanceMatchId(assessor.getPerformanceMatch() != null ? assessor.getPerformanceMatch().getId() : null)
                .matchId(assessor.getMatchId())
                .specialization(assessor.getSpecialization())
                .role(assessor.getRole())
                .position(assessor.getPosition())
                .notes(assessor.getNotes())
                .build();
    }
}


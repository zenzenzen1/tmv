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
    private Assessor.Specialization specialization;

    public static AssessorResponse from(Assessor assessor) {
        if (assessor == null) return null;
        return AssessorResponse.builder()
                .id(assessor.getId())
                .userId(assessor.getUser().getId())
                .fullName(assessor.getUser().getFullName())
                .email(assessor.getUser().getPersonalMail())
                .competitionId(assessor.getCompetition().getId())
                .specialization(assessor.getSpecialization())
                .build();
    }
}


package sep490g65.fvcapi.dto.response;

import lombok.Builder;
import lombok.Data;
import sep490g65.fvcapi.entity.Athlete;

@Data
@Builder
public class AthleteResolvedResponse {
    private String id;
    private String fullName;
    private String email;
    private String studentId;
    private String club;
    private Athlete.Gender gender;
    private Athlete.CompetitionType competitionType;
    private String subCompetitionType;
    private String detailSubLabel;  // resolved label from FK
    private Athlete.AthleteStatus status;

    public static AthleteResolvedResponse from(Athlete a) {
        return AthleteResolvedResponse.builder()
                .id(a.getId() != null ? a.getId().toString() : null)
                .fullName(a.getFullName())
                .email(a.getEmail())
                .studentId(a.getStudentId())
                .club(a.getClub())
                .gender(a.getGender())
                .competitionType(a.getCompetitionType())
                .subCompetitionType(a.getSubCompetitionType())
                .detailSubLabel(null) // to be filled by controller/service layer if needed
                .status(a.getStatus())
                .build();
    }
}



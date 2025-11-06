package sep490g65.fvcapi.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Athlete;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AthleteFiltersRequest {
    
    private String competitionId;
    private String contentId;
    private Athlete.CompetitionType competitionType;
    private String subCompetitionType;
    private String detailSubCompetitionType;
    private String search; // for name, email, studentId, club search
    private Athlete.Gender gender;
    private String club;
    private Athlete.AthleteStatus status;
    private String sortBy;
    private String sortDirection; // "asc" or "desc"
    private Integer page;
    private Integer size;
}

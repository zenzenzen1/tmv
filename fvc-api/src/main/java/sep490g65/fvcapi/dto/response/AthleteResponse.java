package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AthleteResponse {

    private String id;
    private String fullName;
    private String email;
    private String studentId;
    private String gender;
    private String club;
    private Integer teamPosition;
    private Boolean isCaptain;
}
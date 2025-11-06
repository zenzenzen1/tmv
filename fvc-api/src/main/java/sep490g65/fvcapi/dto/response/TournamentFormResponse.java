package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentFormResponse {
    private String id;
    private String competitionId;
    private String tournamentName;
    private String formTitle;
    private String formType;
    private Integer numberOfParticipants;
    private LocalDateTime createdAt;
    private String status;
    private String message;
}



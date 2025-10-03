package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.TournamentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionResponse {
    
    private String id;
    private String name;
    private String description;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private LocalDate weighInDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime openingCeremonyTime;
    private LocalDate drawDate;
    private String location;
    private TournamentStatus status;
    private Integer numberOfParticipants;
    
    // Related content
    private List<WeightClassResponse> weightClasses;
    private List<FistConfigResponse> vovinamFistConfigs;
    private List<MusicContentResponse> musicPerformances;
    
    // Fist content with selected items
    private Map<String, List<FistItemResponse>> fistConfigItemSelections;
    
    // Sparring configuration
    private Integer numberOfRounds;
    private Integer roundDurationSeconds;
    private Boolean allowExtraRound;
    private Integer maxExtraRounds;
    private String tieBreakRule;
    private Integer assessorCount;
    private Integer injuryTimeoutSeconds;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

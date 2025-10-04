package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCompetitionRequest {
    
    @Size(max = 200, message = "Competition name must not exceed 200 characters")
    private String name;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private LocalDate weighInDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime openingCeremonyTime;
    private LocalDate drawDate;
    
    @Size(max = 200, message = "Location must not exceed 200 characters")
    private String location;
    
    @Builder.Default
    private List<String> vovinamFistConfigIds = new ArrayList<>();
    @Builder.Default
    private List<String> musicPerformanceIds = new ArrayList<>();
    @Builder.Default
    private List<String> weightClassIds = new ArrayList<>();
    
    // Fist content selection - config ID mapped to selected item IDs
    @Builder.Default
    private Map<String, List<String>> fistConfigItemSelections = new HashMap<>();
    
    // Sparring configuration
    private Integer numberOfRounds;
    private Integer roundDurationSeconds;
    private Boolean allowExtraRound;
    private Integer maxExtraRounds;
    private String tieBreakRule;
    private Integer assessorCount;
    private Integer injuryTimeoutSeconds;
}

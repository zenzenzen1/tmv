package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateCompetitionRequest {
    
    @NotBlank(message = "Competition name is required")
    @Size(max = 200, message = "Competition name must not exceed 200 characters")
    private String name;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
    
    @NotNull(message = "Registration start date is required")
    private LocalDate registrationStartDate;
    
    @NotNull(message = "Registration end date is required")
    private LocalDate registrationEndDate;
    
    @NotNull(message = "Weigh-in date is required")
    private LocalDate weighInDate;
    
    @NotNull(message = "Competition start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "Competition end date is required")
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
    @Builder.Default
    private Integer numberOfRounds = 2;
    @Builder.Default
    private Integer roundDurationSeconds = 90;
    @Builder.Default
    private Boolean allowExtraRound = true;
    @Builder.Default
    private Integer maxExtraRounds = 1;
    @Builder.Default
    private String tieBreakRule = "WEIGHT";
    @Builder.Default
    private Integer assessorCount = 5;
    @Builder.Default
    private Integer injuryTimeoutSeconds = 60;
}

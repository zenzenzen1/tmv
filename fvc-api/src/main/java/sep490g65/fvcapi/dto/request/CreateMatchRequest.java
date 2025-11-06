package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMatchRequest {
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    private String weightClassId;
    
    private String fieldId;
    
    @NotBlank(message = "Round type is required")
    private String roundType;
    
    @NotBlank(message = "Red athlete ID is required")
    private String redAthleteId;
    
    @NotBlank(message = "Blue athlete ID is required")
    private String blueAthleteId;
    
    private String redAthleteUnit;
    
    private String blueAthleteUnit;
    
    private String redAthleteSbtNumber;
    
    private String blueAthleteSbtNumber;
    
    @Builder.Default
    @NotNull(message = "Total rounds is required")
    @Min(value = 1, message = "Total rounds must be at least 1")
    private Integer totalRounds = 3;
    
    @Builder.Default
    @NotNull(message = "Round duration seconds is required")
    @Min(value = 1, message = "Round duration must be at least 1 second")
    private Integer roundDurationSeconds = 120;
}


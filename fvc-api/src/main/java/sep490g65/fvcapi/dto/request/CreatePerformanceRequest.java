package sep490g65.fvcapi.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Performance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePerformanceRequest {
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    @NotNull(message = "Is team is required")
    private Boolean isTeam;
    
    private String teamId;
    private String teamName;
    
    @NotNull(message = "Performance type is required")
    private Performance.PerformanceType performanceType;
    
    @NotNull(message = "Content type is required")
    private Performance.ContentType contentType;
    
    private String contentId;
    
    private List<String> athleteIds;
    
    private List<Integer> teamPositions;
    
    private List<Boolean> isCaptains;
}

package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionOrderResponse {
    
    private String id;
    
    private String competitionId;
    
    private String competitionName;
    
    private Integer orderIndex;
    
    private String contentSelectionId;
    
    private Integer athleteCount;
    
    private List<String> athleteIds;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}

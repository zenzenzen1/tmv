package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSeedNumbersRequest {
    
    @NotNull(message = "Seed number updates are required")
    private List<SeedNumberUpdate> updates;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeedNumberUpdate {
        @NotBlank(message = "Athlete ID is required")
        private String athleteId;
        
        @NotNull(message = "Seed number is required")
        @Positive(message = "Seed number must be positive")
        private Integer seedNumber;
    }
}


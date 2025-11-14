package sep490g65.fvcapi.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePerformanceMatchAthletePresenceRequest {
    // Map: athleteId -> present (true/false)
    private Map<String, Boolean> athletesPresent;
}


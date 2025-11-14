package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCompetitionDetailResponse {
    private String id;
    private String name;
    private String description;
    private List<WeightClassResponse> weightClasses;
    private List<FistConfigResponse> vovinamFistConfigs;
    private List<MusicPerformanceResponse> musicPerformances;
    private java.util.Map<String, List<FistItemResponse>> fistConfigItemSelections;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeightClassResponse {
        private String id;
        private String weightClass;
        private String gender;
        private Double minWeight;
        private Double maxWeight;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FistConfigResponse {
        private String id;
        private String name;
        private String description;
        private Integer level;
        private String configId;
        private String configName;
        private Integer participantsPerEntry;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FistItemResponse {
        private String id;
        private String name;
        private String description;
        private String configId;
        private Integer participantsPerEntry;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MusicPerformanceResponse {
        private String id;
        private String name;
        private Integer performersPerEntry;
    }
}


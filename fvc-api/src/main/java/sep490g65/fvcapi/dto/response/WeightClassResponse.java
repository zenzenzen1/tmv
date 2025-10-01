package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.Gender;
import sep490g65.fvcapi.enums.WeightClassStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeightClassResponse {
    private String id;
    private Gender gender;
    private BigDecimal minWeight;
    private BigDecimal maxWeight;
    private String note;
    private WeightClassStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}



package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWeightClassRequest {
    @Digits(integer = 3, fraction = 2)
    private BigDecimal minWeight;

    @Digits(integer = 3, fraction = 2)
    private BigDecimal maxWeight;

    @Size(max = 255, message = "Note must not exceed 255 characters")
    private String note;
}



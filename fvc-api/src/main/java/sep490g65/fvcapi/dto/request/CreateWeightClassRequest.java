package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.Gender;
import sep490g65.fvcapi.enums.WeightClassStatus;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWeightClassRequest {
    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Min weight is required")
    @Digits(integer = 3, fraction = 2)
    private BigDecimal minWeight;

    @NotNull(message = "Max weight is required")
    @Digits(integer = 3, fraction = 2)
    private BigDecimal maxWeight;

    @Size(max = 255, message = "Note must not exceed 255 characters")
    private String note;

    private WeightClassStatus saveMode;
}



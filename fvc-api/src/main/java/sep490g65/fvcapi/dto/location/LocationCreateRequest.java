package sep490g65.fvcapi.dto.location;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LocationCreateRequest {
    @NotBlank
    @Size(min = 1, max = 150)
    private String name;

    @Size(max = 255)
    private String address;

    @Min(value = 0, message = "Capacity default must be >= 0")
    private Integer capacityDefault;

    @Size(max = 500)
    private String description;

    private BigDecimal lat;

    private BigDecimal lng;
}



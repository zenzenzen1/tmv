package sep490g65.fvcapi.dto.location;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.dto.user.UserDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDto {
    private String id;
    private String name;
    private String address;
    private Integer capacityDefault;
    private String description;
    private Boolean isActive;
    private BigDecimal lat;
    private BigDecimal lng;
    private UserDto createdBy;
    private UserDto updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}



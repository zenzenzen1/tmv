package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMusicContentRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    @Pattern(
            regexp = "^[\\p{L}\\p{M}0-9\\s]+$",
            message = "Nội dung Võ nhạc không được chứa ký tự đặc biệt"
    )
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotNull(message = "Is active is required")
    @Builder.Default
    private Boolean isActive = true;

    // Number of performers per entry
    @Min(value = 1, message = "Performers per entry must be at least 1")
    @Max(value = 100, message = "Performers per entry must not exceed 100")
    private Integer performersPerEntry;
}



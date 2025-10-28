package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @Size(max = 255, message = "Note must not exceed 255 characters")
    private String name;
    
    @Size(max = 255, message = "Note must not exceed 255 characters")
    private String description;
    
    @NotNull(message = "Is active is required")
    @Builder.Default
    private Boolean isActive = true;

    // Number of performers per entry
    private Integer performersPerEntry;
}



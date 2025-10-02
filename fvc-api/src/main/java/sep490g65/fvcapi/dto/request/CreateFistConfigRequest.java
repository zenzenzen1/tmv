package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFistConfigRequest {
    @NotBlank
    private String name;
    private String description;
    private Boolean status;
}



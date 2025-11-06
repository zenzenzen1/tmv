package sep490g65.fvcapi.dto.phase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhaseOrderUpdate {
    @NotBlank
    private String phaseId;
    @NotNull
    private Integer order;
}



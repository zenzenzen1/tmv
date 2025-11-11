package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import sep490g65.fvcapi.enums.ApplicationFormStatus;

import java.util.List;

@Data
public class BulkUpdateStatusRequest {
    
    @NotEmpty(message = "IDs list cannot be empty")
    private List<Long> ids;
    
    @NotNull(message = "Status is required")
    private ApplicationFormStatus status;
}

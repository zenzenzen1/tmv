package sep490g65.fvcapi.dto.attendance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkAttendanceRequest {
    @NotEmpty(message = "attendances must not be empty")
    @Valid
    private List<SessionAttendanceCreateRequest> attendances;
}



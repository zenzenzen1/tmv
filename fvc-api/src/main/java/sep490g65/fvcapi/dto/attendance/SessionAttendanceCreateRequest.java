package sep490g65.fvcapi.dto.attendance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.AttendanceStatus;

@Data
public class SessionAttendanceCreateRequest {
    @NotBlank(message = "userId is required")
    private String userId;

    @NotNull(message = "status is required")
    private AttendanceStatus status;

    @Size(max = 500, message = "note must not exceed 500 characters")
    private String note;
}



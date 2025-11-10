package sep490g65.fvcapi.dto.attendance;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import sep490g65.fvcapi.enums.AttendanceStatus;

@Data
public class SessionAttendanceUpdateRequest {
    @NotNull
    private AttendanceStatus status;

    @Size(max = 500)
    private String note;
}



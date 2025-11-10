package sep490g65.fvcapi.dto.attendance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.dto.training.TrainingSessionDto;
import sep490g65.fvcapi.dto.user.UserDto;
import sep490g65.fvcapi.enums.AttendanceMethod;
import sep490g65.fvcapi.enums.AttendanceStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionAttendanceDto {
    private String id;
    private TrainingSessionDto session;
    private UserDto user;
    private AttendanceStatus status;
    private LocalDateTime markedAt;
    private UserDto markedBy;
    private AttendanceMethod method;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}



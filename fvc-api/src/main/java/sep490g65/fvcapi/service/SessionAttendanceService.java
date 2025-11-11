package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.attendance.BulkAttendanceRequest;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceCreateRequest;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceDto;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceUpdateRequest;

import java.util.Map;

public interface SessionAttendanceService {
    Page<SessionAttendanceDto> findBySession(String sessionId, Pageable pageable);
    SessionAttendanceDto getById(String id);
    SessionAttendanceDto markAttendance(String sessionId, SessionAttendanceCreateRequest request);
    SessionAttendanceDto updateAttendance(String id, SessionAttendanceUpdateRequest request);
    void bulkMarkAttendance(String sessionId, BulkAttendanceRequest request);
    Map<String, Long> getStatistics(String sessionId);
}



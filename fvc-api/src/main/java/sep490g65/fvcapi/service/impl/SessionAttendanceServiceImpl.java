package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.attendance.BulkAttendanceRequest;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceCreateRequest;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceDto;
import sep490g65.fvcapi.dto.attendance.SessionAttendanceUpdateRequest;
import sep490g65.fvcapi.dto.training.TrainingSessionDto;
import sep490g65.fvcapi.dto.user.UserDto;
import sep490g65.fvcapi.entity.SessionAttendance;
import sep490g65.fvcapi.entity.TrainingSession;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.AttendanceMethod;
import sep490g65.fvcapi.enums.AttendanceStatus;
import sep490g65.fvcapi.enums.TrainingSessionStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.SessionAttendanceRepository;
import sep490g65.fvcapi.repository.TrainingSessionRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.SessionAttendanceService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionAttendanceServiceImpl implements SessionAttendanceService {

    private final SessionAttendanceRepository sessionAttendanceRepository;
    private final TrainingSessionRepository trainingSessionRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<SessionAttendanceDto> findBySession(String sessionId, Pageable pageable) {
        return sessionAttendanceRepository.findBySessionId(sessionId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SessionAttendanceDto getById(String id) {
        SessionAttendance attendance = sessionAttendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SessionAttendance", "id", id));
        return toDto(attendance);
    }

    @Override
    public SessionAttendanceDto markAttendance(String sessionId, SessionAttendanceCreateRequest request) {
        // Get and validate session
        TrainingSession session = trainingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", "id", sessionId));

        if (session.getStatus() == TrainingSessionStatus.CANCELLED) {
            throw new BusinessException("Cannot mark attendance for cancelled session");
        }

        // Get and validate user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        // Get current user (who marks the attendance)
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        User markedByUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Check if attendance already exists (UPSERT logic)
        SessionAttendance attendance = sessionAttendanceRepository
                .findBySessionIdAndUserId(sessionId, request.getUserId())
                .orElse(new SessionAttendance());

        attendance.setSession(session);
        attendance.setUser(user);
        attendance.setStatus(request.getStatus());
        attendance.setNote(request.getNote());
        attendance.setMarkedAt(LocalDateTime.now());
        attendance.setMarkedBy(markedByUser);
        attendance.setMethod(AttendanceMethod.MANUAL);

        SessionAttendance saved = sessionAttendanceRepository.save(attendance);
        return toDto(saved);
    }

    @Override
    public SessionAttendanceDto updateAttendance(String id, SessionAttendanceUpdateRequest request) {
        SessionAttendance attendance = sessionAttendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SessionAttendance", "id", id));

        // Validate session is not cancelled
        if (attendance.getSession().getStatus() == TrainingSessionStatus.CANCELLED) {
            throw new BusinessException("Cannot update attendance for cancelled session");
        }

        // Validate session is in progress or completed
        TrainingSessionStatus sessionStatus = attendance.getSession().getStatus();
        if (sessionStatus != TrainingSessionStatus.IN_PROGRESS && 
            sessionStatus != TrainingSessionStatus.COMPLETED) {
            throw new BusinessException("Can only edit attendance while session is IN_PROGRESS or COMPLETED");
        }

        attendance.setStatus(request.getStatus());
        if (request.getNote() != null) {
            attendance.setNote(request.getNote());
        }
        attendance.setMarkedAt(LocalDateTime.now());

        SessionAttendance saved = sessionAttendanceRepository.save(attendance);
        return toDto(saved);
    }

    @Override
    public void bulkMarkAttendance(String sessionId, BulkAttendanceRequest request) {
        // Get and validate session
        TrainingSession session = trainingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", "id", sessionId));

        if (session.getStatus() == TrainingSessionStatus.CANCELLED) {
            throw new BusinessException("Cannot mark attendance for cancelled session");
        }

        // Get current user (who marks the attendance)
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        User markedByUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Process each attendance record
        for (SessionAttendanceCreateRequest attendanceRequest : request.getAttendances()) {
            // Get and validate user
            User user = userRepository.findById(attendanceRequest.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", attendanceRequest.getUserId()));

            // Check if attendance already exists (UPSERT logic)
            SessionAttendance attendance = sessionAttendanceRepository
                    .findBySessionIdAndUserId(sessionId, attendanceRequest.getUserId())
                    .orElse(new SessionAttendance());

            attendance.setSession(session);
            attendance.setUser(user);
            attendance.setStatus(attendanceRequest.getStatus());
            attendance.setNote(attendanceRequest.getNote());
            attendance.setMarkedAt(LocalDateTime.now());
            attendance.setMarkedBy(markedByUser);
            attendance.setMethod(AttendanceMethod.MANUAL);

            sessionAttendanceRepository.save(attendance);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getStatistics(String sessionId) {
        List<SessionAttendance> attendances = sessionAttendanceRepository.findBySessionId(sessionId);

        Map<String, Long> stats = new HashMap<>();
        stats.put("TOTAL", (long) attendances.size());
        stats.put("PRESENT", attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count());
        stats.put("ABSENT", attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count());
        stats.put("LATE", attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count());
        stats.put("EXCUSED", attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.EXCUSED).count());

        return stats;
    }

    private SessionAttendanceDto toDto(SessionAttendance entity) {
        return SessionAttendanceDto.builder()
                .id(entity.getId())
                .session(entity.getSession() != null ? toSessionDto(entity.getSession()) : null)
                .user(entity.getUser() != null ? toUserDto(entity.getUser()) : null)
                .status(entity.getStatus())
                .markedAt(entity.getMarkedAt())
                .markedBy(entity.getMarkedBy() != null ? toUserDto(entity.getMarkedBy()) : null)
                .method(entity.getMethod())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private TrainingSessionDto toSessionDto(TrainingSession session) {
        return TrainingSessionDto.builder()
                .id(session.getId())
                .title(session.getTitle())
                .description(session.getDescription())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .capacity(session.getCapacity())
                .status(session.getStatus())
                .build();
    }

    private UserDto toUserDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .build();
    }
}



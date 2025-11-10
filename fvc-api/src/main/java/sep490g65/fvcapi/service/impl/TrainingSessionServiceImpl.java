package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.training.TrainingSessionCreateRequest;
import sep490g65.fvcapi.dto.training.TrainingSessionDto;
import sep490g65.fvcapi.dto.training.TrainingSessionUpdateRequest;
import sep490g65.fvcapi.entity.*;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;
import sep490g65.fvcapi.enums.TrainingSessionStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.*;
import sep490g65.fvcapi.service.TrainingSessionService;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingSessionServiceImpl implements TrainingSessionService {

    private final TrainingSessionRepository trainingSessionRepository;
    private final ChallengeCycleRepository challengeCycleRepository;
    private final ChallengePhaseRepository challengePhaseRepository;
    private final TeamRepository teamRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final SessionAttendanceRepository sessionAttendanceRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<TrainingSessionDto> list(String cycleId, String teamId, String phaseId, String locationId,
                                          TrainingSessionStatus status, LocalDateTime startDate, LocalDateTime endDate,
                                          Pageable pageable) {
        Specification<TrainingSession> spec = Specification.where(null);

        if (cycleId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("cycle").get("id"), cycleId));
        }
        if (teamId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("team").get("id"), teamId));
        }
        if (phaseId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("phase").get("id"), phaseId));
        }
        if (locationId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("location").get("id"), locationId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("startTime"), startDate));
        }
        if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("endTime"), endDate));
        }

        return trainingSessionRepository.findAll(spec, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TrainingSessionDto> getCalendar(String cycleId, String teamId, String phaseId,
                                                LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return list(cycleId, teamId, phaseId, null, null, startDate, endDate, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingSessionDto getById(String id) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", "id", id));
        return toDto(session);
    }

    @Override
    public TrainingSessionDto create(TrainingSessionCreateRequest request) {
        // Validate time range
        if (request.getEndTime().isBefore(request.getStartTime()) || 
            request.getEndTime().equals(request.getStartTime())) {
            throw new BusinessException("End time must be after start time");
        }

        // Get and validate cycle
        ChallengeCycle cycle = challengeCycleRepository.findById(request.getCycleId())
                .orElseThrow(() -> new ResourceNotFoundException("ChallengeCycle", "id", request.getCycleId()));
        
        if (cycle.getStatus() != ChallengeCycleStatus.ACTIVE) {
            throw new BusinessException("Cycle must be ACTIVE to create sessions");
        }

        // Get and validate team (if provided)
        Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.getTeamId()));
            if (!team.getCycle().getId().equals(cycle.getId())) {
                throw new BusinessException("Team does not belong to the selected cycle");
            }
        }

        // Get and validate phase (if provided)
        ChallengePhase phase = null;
        if (request.getPhaseId() != null) {
            phase = challengePhaseRepository.findById(request.getPhaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("ChallengePhase", "id", request.getPhaseId()));
            if (!phase.getCycle().getId().equals(cycle.getId())) {
                throw new BusinessException("Phase does not belong to the selected cycle");
            }
        }

        // Get and validate location (if provided)
        Location location = null;
        if (request.getLocationId() != null) {
            location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location", "id", request.getLocationId()));
            if (!location.getIsActive()) {
                throw new BusinessException("Location is not active");
            }
        }

        // Validate capacity
        if (request.getCapacity() != null && request.getCapacity() < 0) {
            throw new BusinessException("Capacity must be >= 0");
        }

        // Get current user
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        TrainingSession session = new TrainingSession();
        session.setTitle(request.getTitle());
        session.setDescription(request.getDescription());
        session.setCycle(cycle);
        session.setTeam(team);
        session.setPhase(phase);
        session.setLocation(location);
        session.setStartTime(request.getStartTime());
        session.setEndTime(request.getEndTime());
        session.setCapacity(request.getCapacity());
        session.setStatus(request.getStatus() != null ? request.getStatus() : TrainingSessionStatus.PLANNED);
        session.setCreatedBy(currentUser);

        TrainingSession saved = trainingSessionRepository.save(session);
        return toDto(saved);
    }

    @Override
    public TrainingSessionDto update(String id, TrainingSessionUpdateRequest request) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", "id", id));

        // Check if session has attendance records (prevent changing cycle/team)
        long attendanceCount = sessionAttendanceRepository.findBySessionId(id).size();
        if (attendanceCount > 0) {
            if (request.getTeamId() != null && !request.getTeamId().equals(session.getTeam() != null ? session.getTeam().getId() : null)) {
                throw new BusinessException("Cannot change team when session has attendance records");
            }
        }

        // Validate time range if both provided
        if (request.getStartTime() != null && request.getEndTime() != null) {
            if (request.getEndTime().isBefore(request.getStartTime()) || 
                request.getEndTime().equals(request.getStartTime())) {
                throw new BusinessException("End time must be after start time");
            }
        }

        // Get and validate team (if provided)
        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.getTeamId()));
            if (!team.getCycle().getId().equals(session.getCycle().getId())) {
                throw new BusinessException("Team does not belong to the session's cycle");
            }
            session.setTeam(team);
        }

        // Get and validate phase (if provided)
        if (request.getPhaseId() != null) {
            ChallengePhase phase = challengePhaseRepository.findById(request.getPhaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("ChallengePhase", "id", request.getPhaseId()));
            if (!phase.getCycle().getId().equals(session.getCycle().getId())) {
                throw new BusinessException("Phase does not belong to the session's cycle");
            }
            session.setPhase(phase);
        }

        // Get and validate location (if provided)
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location", "id", request.getLocationId()));
            if (!location.getIsActive()) {
                throw new BusinessException("Location is not active");
            }
            session.setLocation(location);
        }

        // Get current user for updatedBy
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (request.getTitle() != null) {
            session.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            session.setDescription(request.getDescription());
        }
        if (request.getStartTime() != null) {
            session.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            session.setEndTime(request.getEndTime());
        }
        if (request.getCapacity() != null) {
            if (request.getCapacity() < 0) {
                throw new BusinessException("Capacity must be >= 0");
            }
            session.setCapacity(request.getCapacity());
        }
        if (request.getStatus() != null) {
            session.setStatus(request.getStatus());
        }

        session.setUpdatedBy(currentUser);

        TrainingSession saved = trainingSessionRepository.save(session);
        return toDto(saved);
    }

    @Override
    public TrainingSessionDto updateStatus(String id, TrainingSessionStatus status) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", "id", id));

        // Validate status transition
        TrainingSessionStatus currentStatus = session.getStatus();
        if (currentStatus == TrainingSessionStatus.CANCELLED) {
            throw new BusinessException("Cannot change status of cancelled session");
        }
        if (currentStatus == TrainingSessionStatus.COMPLETED && status != TrainingSessionStatus.COMPLETED) {
            throw new BusinessException("Cannot change status of completed session");
        }

        // Get current user for updatedBy
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        session.setStatus(status);
        session.setUpdatedBy(currentUser);

        TrainingSession saved = trainingSessionRepository.save(session);
        return toDto(saved);
    }

    @Override
    public void delete(String id) {
        TrainingSession session = trainingSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TrainingSession", "id", id));

        // Check if session has attendance records
        long attendanceCount = sessionAttendanceRepository.findBySessionId(id).size();
        if (attendanceCount > 0) {
            throw new BusinessException("Cannot delete session with attendance records. Cancel instead.");
        }

        trainingSessionRepository.delete(session);
    }

    private TrainingSessionDto toDto(TrainingSession entity) {
        return TrainingSessionDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .cycle(entity.getCycle() != null ? toCycleDto(entity.getCycle()) : null)
                .team(entity.getTeam() != null ? toTeamDto(entity.getTeam()) : null)
                .phase(entity.getPhase() != null ? toPhaseDto(entity.getPhase()) : null)
                .location(entity.getLocation() != null ? toLocationDto(entity.getLocation()) : null)
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .capacity(entity.getCapacity())
                .status(entity.getStatus())
                .createdBy(entity.getCreatedBy() != null ? toUserDto(entity.getCreatedBy()) : null)
                .updatedBy(entity.getUpdatedBy() != null ? toUserDto(entity.getUpdatedBy()) : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private sep490g65.fvcapi.dto.cycle.ChallengeCycleDto toCycleDto(ChallengeCycle cycle) {
        return sep490g65.fvcapi.dto.cycle.ChallengeCycleDto.builder()
                .id(cycle.getId())
                .name(cycle.getName())
                .description(cycle.getDescription())
                .startDate(cycle.getStartDate())
                .endDate(cycle.getEndDate())
                .cycleDurationMonths(cycle.getCycleDurationMonths())
                .phaseDurationWeeks(cycle.getPhaseDurationWeeks())
                .status(cycle.getStatus())
                .trainSessionsRequired(cycle.getTrainSessionsRequired())
                .eventsRequired(cycle.getEventsRequired())
                .build();
    }

    private sep490g65.fvcapi.dto.team.TeamDto toTeamDto(Team team) {
        return sep490g65.fvcapi.dto.team.TeamDto.builder()
                .id(team.getId())
                .cycleId(team.getCycle().getId())
                .code(team.getCode())
                .name(team.getName())
                .description(team.getDescription())
                .build();
    }

    private sep490g65.fvcapi.dto.phase.ChallengePhaseDto toPhaseDto(ChallengePhase phase) {
        return sep490g65.fvcapi.dto.phase.ChallengePhaseDto.builder()
                .id(phase.getId())
                .cycleId(phase.getCycle().getId())
                .name(phase.getName())
                .description(phase.getDescription())
                .startDate(phase.getStartDate())
                .endDate(phase.getEndDate())
                .status(phase.getStatus())
                .order(phase.getOrder())
                .build();
    }

    private sep490g65.fvcapi.dto.location.LocationDto toLocationDto(Location location) {
        return sep490g65.fvcapi.dto.location.LocationDto.builder()
                .id(location.getId())
                .name(location.getName())
                .address(location.getAddress())
                .capacityDefault(location.getCapacityDefault())
                .description(location.getDescription())
                .isActive(location.getIsActive())
                .lat(location.getLat())
                .lng(location.getLng())
                .build();
    }

    private sep490g65.fvcapi.dto.user.UserDto toUserDto(User user) {
        if (user == null) return null;
        return sep490g65.fvcapi.dto.user.UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .phoneNumber(user.getPhoneNumber())
                .build();
    }
}



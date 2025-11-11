package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleBulkCreateRequest;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleCreateRequest;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleDto;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleUpdateRequest;
import sep490g65.fvcapi.dto.phase.ChallengePhaseCreateRequest;
import sep490g65.fvcapi.dto.team.TeamWithMembersCreateRequest;
import sep490g65.fvcapi.entity.ChallengeCycle;
import sep490g65.fvcapi.entity.ChallengePhase;
import sep490g65.fvcapi.entity.Team;
import sep490g65.fvcapi.entity.TeamMember;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.ChallengeCycleRepository;
import sep490g65.fvcapi.repository.ChallengePhaseRepository;
import sep490g65.fvcapi.repository.TeamMemberRepository;
import sep490g65.fvcapi.repository.TeamRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.ChallengeCycleService;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class ChallengeCycleServiceImpl implements ChallengeCycleService {

    private final ChallengeCycleRepository challengeCycleRepository;
    private final ChallengePhaseRepository challengePhaseRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ChallengeCycleDto> list(ChallengeCycleStatus status, String search, Pageable pageable) {
        Specification<ChallengeCycle> spec = Specification.where(null);
        
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        
        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("name")), searchPattern));
        }
        
        return challengeCycleRepository.findAll(spec, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ChallengeCycleDto getById(String id) {
        ChallengeCycle cycle = challengeCycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengeCycle", "id", id));
        return toDto(cycle);
    }

    @Override
    public ChallengeCycleDto create(ChallengeCycleCreateRequest request) {
        // Tính toán endDate từ startDate + cycleDurationMonths nếu chưa có
        LocalDate calculatedEndDate = request.getEndDate();
        if (calculatedEndDate == null && request.getCycleDurationMonths() != null) {
            calculatedEndDate = request.getStartDate().plusMonths(request.getCycleDurationMonths());
        }
        
        validateDates(request.getStartDate(), calculatedEndDate);
        if (challengeCycleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Cycle name already exists");
        }
        
        ChallengeCycle cycle = new ChallengeCycle();
        cycle.setName(request.getName());
        cycle.setDescription(request.getDescription());
        cycle.setStartDate(request.getStartDate());
        cycle.setEndDate(calculatedEndDate);
        cycle.setCycleDurationMonths(request.getCycleDurationMonths());
        cycle.setPhaseDurationWeeks(request.getPhaseDurationWeeks());
        cycle.setStatus(request.getStatus());
        // Lưu các tiêu chí đánh giá mặc định
        cycle.setTrainSessionsRequired(request.getTrainSessionsRequired());
        cycle.setEventsRequired(request.getEventsRequired());
        
        ChallengeCycle saved = challengeCycleRepository.save(cycle);
        
        // Tự động tạo phases nếu có phaseDurationWeeks
        if (saved.getPhaseDurationWeeks() != null && saved.getPhaseDurationWeeks() > 0 
            && saved.getStartDate() != null && saved.getEndDate() != null) {
            autoGeneratePhases(saved);
        }
        
        return toDto(saved);
    }
    
    /**
     * Tự động tạo phases dựa trên phaseDurationWeeks và cycleDurationMonths
     * Ví dụ: Cycle 3 tháng, mỗi phase 2 tuần => tạo 6 phases
     */
    private void autoGeneratePhases(ChallengeCycle cycle) {
        LocalDate currentPhaseStart = cycle.getStartDate();
        LocalDate cycleEnd = cycle.getEndDate();
        int phaseNumber = 1;
        
        while (currentPhaseStart.isBefore(cycleEnd) || currentPhaseStart.isEqual(cycleEnd)) {
            LocalDate phaseEnd = currentPhaseStart.plusWeeks(cycle.getPhaseDurationWeeks()).minusDays(1);
            
            // Đảm bảo phase không vượt quá cycle end date
            if (phaseEnd.isAfter(cycleEnd)) {
                phaseEnd = cycleEnd;
            }
            
            // Kiểm tra xem phase name đã tồn tại chưa
            String phaseName = String.format("Giai Đoạn %d", phaseNumber);
            if (challengePhaseRepository.existsByCycle_IdAndNameIgnoreCase(cycle.getId(), phaseName)) {
                phaseName = String.format("Giai Đoạn %d (Tự động)", phaseNumber);
            }
            
            ChallengePhase phase = new ChallengePhase();
            phase.setCycle(cycle);
            phase.setName(phaseName);
            phase.setDescription(String.format("Giai đoạn tự động tạo - %d tuần", cycle.getPhaseDurationWeeks()));
            phase.setStartDate(currentPhaseStart);
            phase.setEndDate(phaseEnd);
            phase.setStatus(sep490g65.fvcapi.enums.PhaseStatus.NOT_STARTED);
            challengePhaseRepository.save(phase);
            
            // Chuyển sang phase tiếp theo
            currentPhaseStart = phaseEnd.plusDays(1);
            phaseNumber++;
            
            // Nếu phase tiếp theo vượt quá cycle end, dừng lại
            if (currentPhaseStart.isAfter(cycleEnd)) {
                break;
            }
        }
    }

    @Override
    public ChallengeCycleDto createBulk(ChallengeCycleBulkCreateRequest request) {
        // Create the cycle first (không auto-generate phases trong createBulk)
        // Vì createBulk cho phép tạo phases thủ công hoặc để auto-generate sau
        LocalDate calculatedEndDate = request.getCycle().getEndDate();
        if (calculatedEndDate == null && request.getCycle().getCycleDurationMonths() != null) {
            calculatedEndDate = request.getCycle().getStartDate().plusMonths(request.getCycle().getCycleDurationMonths());
        }
        
        validateDates(request.getCycle().getStartDate(), calculatedEndDate);
        if (challengeCycleRepository.existsByNameIgnoreCase(request.getCycle().getName())) {
            throw new BusinessException("Cycle name already exists");
        }
        
        ChallengeCycle cycle = new ChallengeCycle();
        cycle.setName(request.getCycle().getName());
        cycle.setDescription(request.getCycle().getDescription());
        cycle.setStartDate(request.getCycle().getStartDate());
        cycle.setEndDate(calculatedEndDate);
        cycle.setCycleDurationMonths(request.getCycle().getCycleDurationMonths());
        cycle.setPhaseDurationWeeks(request.getCycle().getPhaseDurationWeeks());
        cycle.setStatus(request.getCycle().getStatus());
        // Lưu các tiêu chí đánh giá mặc định
        cycle.setTrainSessionsRequired(request.getCycle().getTrainSessionsRequired());
        cycle.setEventsRequired(request.getCycle().getEventsRequired());
        
        ChallengeCycle saved = challengeCycleRepository.save(cycle);

        // Tạo phases: nếu có phases trong request thì dùng, nếu không thì auto-generate
        if (request.getPhases() != null && !request.getPhases().isEmpty()) {
            // Tạo phases từ request
            for (ChallengePhaseCreateRequest phaseRequest : request.getPhases()) {
                validateDatesWithinCycle(phaseRequest.getStartDate(), phaseRequest.getEndDate(), saved);
                if (challengePhaseRepository.existsByCycle_IdAndNameIgnoreCase(saved.getId(), phaseRequest.getName())) {
                    throw new BusinessException("Phase name already exists in cycle: " + phaseRequest.getName());
                }
                ChallengePhase phase = new ChallengePhase();
                phase.setCycle(saved);
                phase.setName(phaseRequest.getName());
                phase.setDescription(phaseRequest.getDescription());
                phase.setStartDate(phaseRequest.getStartDate());
                phase.setEndDate(phaseRequest.getEndDate());
                phase.setStatus(phaseRequest.getStatus());
                challengePhaseRepository.save(phase);
            }
        } else if (saved.getPhaseDurationWeeks() != null && saved.getPhaseDurationWeeks() > 0 
            && saved.getStartDate() != null && saved.getEndDate() != null) {
            // Auto-generate phases nếu không có phases trong request
            autoGeneratePhases(saved);
        }

        // Create teams with members
        for (TeamWithMembersCreateRequest teamRequest : request.getTeams()) {
            String codeUpper = teamRequest.getTeam().getCode().toUpperCase();
            if (teamRepository.existsByCycle_IdAndCodeIgnoreCase(saved.getId(), codeUpper)) {
                throw new BusinessException("Team code already exists in cycle: " + codeUpper);
            }
            Team team = new Team();
            team.setCycle(saved);
            team.setCode(codeUpper);
            team.setName(teamRequest.getTeam().getName());
            team.setDescription(teamRequest.getTeam().getDescription());
            Team savedTeam = teamRepository.save(team);

            // Add members to team
            for (var memberRequest : teamRequest.getMembers()) {
                User user = userRepository.findById(memberRequest.getUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", memberRequest.getUserId()));
                if (teamMemberRepository.existsActiveMembership(savedTeam.getId(), user.getId())) {
                    throw new BusinessException("User already a member of this team: " + user.getId());
                }
                TeamMember member = new TeamMember();
                member.setTeam(savedTeam);
                member.setUser(user);
                member.setJoinedAt(LocalDateTime.now());
                member.setStatus("ACTIVE");
                teamMemberRepository.save(member);
            }
        }

        return toDto(saved);
    }

    private void validateDatesWithinCycle(LocalDate start, LocalDate end, ChallengeCycle cycle) {
        if (start == null || end == null) {
            throw new BusinessException("Phase dates cannot be null");
        }
        if (end.isBefore(start)) {
            throw new BusinessException("Phase end date must be after start date");
        }
        if (start.isBefore(cycle.getStartDate()) || end.isAfter(cycle.getEndDate())) {
            throw new BusinessException("Phase dates must be within cycle date range");
        }
    }

    @Override
    public ChallengeCycleDto update(String id, ChallengeCycleUpdateRequest request) {
        ChallengeCycle cycle = challengeCycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengeCycle", "id", id));
        
        // name uniqueness if changed
        if (!cycle.getName().equalsIgnoreCase(request.getName()) &&
                challengeCycleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Cycle name already exists");
        }
        
        // Tính toán endDate nếu có cycleDurationMonths
        LocalDate calculatedEndDate = request.getEndDate();
        if (calculatedEndDate == null && request.getCycleDurationMonths() != null) {
            calculatedEndDate = request.getStartDate().plusMonths(request.getCycleDurationMonths());
        } else if (calculatedEndDate == null && cycle.getCycleDurationMonths() != null) {
            calculatedEndDate = request.getStartDate().plusMonths(cycle.getCycleDurationMonths());
        }
        
        validateDates(request.getStartDate(), calculatedEndDate);
        
        cycle.setName(request.getName());
        cycle.setDescription(request.getDescription());
        cycle.setStartDate(request.getStartDate());
        cycle.setEndDate(calculatedEndDate);
        
        // Cập nhật duration nếu có
        if (request.getCycleDurationMonths() != null) {
            cycle.setCycleDurationMonths(request.getCycleDurationMonths());
        }
        if (request.getPhaseDurationWeeks() != null) {
            cycle.setPhaseDurationWeeks(request.getPhaseDurationWeeks());
        }
        
        cycle.setStatus(request.getStatus());
        // Cập nhật các tiêu chí đánh giá (chỉ cập nhật nếu có giá trị mới)
        if (request.getTrainSessionsRequired() != null) {
            cycle.setTrainSessionsRequired(request.getTrainSessionsRequired());
        }
        if (request.getEventsRequired() != null) {
            cycle.setEventsRequired(request.getEventsRequired());
        }
        return toDto(challengeCycleRepository.save(cycle));
    }

    @Override
    public ChallengeCycleDto activate(String id) {
        ChallengeCycle cycle = getEntity(id);
        if (cycle.getStatus() != ChallengeCycleStatus.DRAFT) {
            throw new BusinessException("Only DRAFT cycles can be activated");
        }
        cycle.setStatus(ChallengeCycleStatus.ACTIVE);
        return toDto(challengeCycleRepository.save(cycle));
    }

    @Override
    public ChallengeCycleDto complete(String id) {
        ChallengeCycle cycle = getEntity(id);
        if (cycle.getStatus() != ChallengeCycleStatus.ACTIVE) {
            throw new BusinessException("Only ACTIVE cycles can be completed");
        }
        cycle.setStatus(ChallengeCycleStatus.COMPLETED);
        return toDto(challengeCycleRepository.save(cycle));
    }

    @Override
    public ChallengeCycleDto archive(String id) {
        ChallengeCycle cycle = getEntity(id);
        if (cycle.getStatus() != ChallengeCycleStatus.COMPLETED) {
            throw new BusinessException("Only COMPLETED cycles can be archived");
        }
        cycle.setStatus(ChallengeCycleStatus.ARCHIVED);
        return toDto(challengeCycleRepository.save(cycle));
    }

    private ChallengeCycle getEntity(String id) {
        return challengeCycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengeCycle", "id", id));
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new BusinessException("End date must be after start date");
        }
    }

    private ChallengeCycleDto toDto(ChallengeCycle entity) {
        return ChallengeCycleDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .cycleDurationMonths(entity.getCycleDurationMonths())
                .phaseDurationWeeks(entity.getPhaseDurationWeeks())
                .status(entity.getStatus())
                .trainSessionsRequired(entity.getTrainSessionsRequired())
                .eventsRequired(entity.getEventsRequired())
                .build();
    }
}



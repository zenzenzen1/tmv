package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.phase.ChallengePhaseCreateRequest;
import sep490g65.fvcapi.dto.phase.ChallengePhaseDto;
import sep490g65.fvcapi.dto.phase.ChallengePhaseUpdateRequest;
import sep490g65.fvcapi.dto.phase.PhaseOrderUpdate;
import sep490g65.fvcapi.entity.ChallengeCycle;
import sep490g65.fvcapi.entity.ChallengePhase;
import sep490g65.fvcapi.enums.PhaseStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.ChallengeCycleRepository;
import sep490g65.fvcapi.repository.ChallengePhaseRepository;
import sep490g65.fvcapi.service.ChallengePhaseService;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChallengePhaseServiceImpl implements ChallengePhaseService {

    private final ChallengePhaseRepository challengePhaseRepository;
    private final ChallengeCycleRepository challengeCycleRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ChallengePhaseDto> listByCycle(String cycleId, PhaseStatus status, String search, Pageable pageable) {
        Specification<ChallengePhase> spec = (root, query, cb) -> 
            cb.equal(root.get("cycle").get("id"), cycleId);
        
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        
        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("name")), searchPattern));
        }
        
        return challengePhaseRepository.findAll(spec, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ChallengePhaseDto getById(String id) {
        ChallengePhase phase = challengePhaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengePhase", "id", id));
        return toDto(phase);
    }

    @Override
    public ChallengePhaseDto create(String cycleId, ChallengePhaseCreateRequest request) {
        ChallengeCycle cycle = getCycle(cycleId);
        validateDatesWithinCycle(request.getStartDate(), request.getEndDate(), cycle);
        if (challengePhaseRepository.existsByCycle_IdAndNameIgnoreCase(cycleId, request.getName())) {
            throw new BusinessException("Phase name already exists in cycle");
        }
        ChallengePhase phase = new ChallengePhase();
        phase.setCycle(cycle);
        phase.setName(request.getName());
        phase.setDescription(request.getDescription());
        phase.setStartDate(request.getStartDate());
        phase.setEndDate(request.getEndDate());
        phase.setStatus(request.getStatus());
        // order not stored on entity yet unless you have a field; skipping
        return toDto(challengePhaseRepository.save(phase));
    }

    @Override
    public ChallengePhaseDto update(String id, ChallengePhaseUpdateRequest request) {
        ChallengePhase phase = challengePhaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengePhase", "id", id));
        validateDatesWithinCycle(request.getStartDate(), request.getEndDate(), phase.getCycle());
        if (!phase.getName().equalsIgnoreCase(request.getName()) &&
                challengePhaseRepository.existsByCycle_IdAndNameIgnoreCase(phase.getCycle().getId(), request.getName())) {
            throw new BusinessException("Phase name already exists in cycle");
        }
        phase.setName(request.getName());
        phase.setDescription(request.getDescription());
        phase.setStartDate(request.getStartDate());
        phase.setEndDate(request.getEndDate());
        phase.setStatus(request.getStatus());
        return toDto(challengePhaseRepository.save(phase));
    }

    @Override
    public void reorder(String cycleId, List<PhaseOrderUpdate> orderUpdates) {
        // Placeholder: implement when entity supports order field
        // Validate cycle exists
        getCycle(cycleId);
        // No-op for now
    }

    private ChallengeCycle getCycle(String id) {
        return challengeCycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengeCycle", "id", id));
    }

    private void validateDatesWithinCycle(LocalDate start, LocalDate end, ChallengeCycle cycle) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new BusinessException("End date must be after start date");
        }
        if (cycle.getStartDate() != null && start != null && start.isBefore(cycle.getStartDate())) {
            throw new BusinessException("Phase start date must be on/after cycle start date");
        }
        if (cycle.getEndDate() != null && end != null && end.isAfter(cycle.getEndDate())) {
            throw new BusinessException("Phase end date must be on/before cycle end date");
        }
    }

    private ChallengePhaseDto toDto(ChallengePhase entity) {
        return ChallengePhaseDto.builder()
                .id(entity.getId())
                .cycleId(entity.getCycle() != null ? entity.getCycle().getId() : null)
                .name(entity.getName())
                .description(entity.getDescription())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .status(entity.getStatus())
                .build();
    }
}



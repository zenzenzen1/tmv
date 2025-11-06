package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleCreateRequest;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleDto;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleUpdateRequest;
import sep490g65.fvcapi.entity.ChallengeCycle;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.ChallengeCycleRepository;
import sep490g65.fvcapi.service.ChallengeCycleService;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class ChallengeCycleServiceImpl implements ChallengeCycleService {

    private final ChallengeCycleRepository challengeCycleRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ChallengeCycleDto> list(ChallengeCycleStatus status, String search, Pageable pageable) {
        return challengeCycleRepository.search(status, search, pageable)
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
        validateDates(request.getStartDate(), request.getEndDate());
        if (challengeCycleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Cycle name already exists");
        }
        ChallengeCycle cycle = new ChallengeCycle();
        cycle.setName(request.getName());
        cycle.setDescription(request.getDescription());
        cycle.setStartDate(request.getStartDate());
        cycle.setEndDate(request.getEndDate());
        cycle.setStatus(request.getStatus());
        ChallengeCycle saved = challengeCycleRepository.save(cycle);
        return toDto(saved);
    }

    @Override
    public ChallengeCycleDto update(String id, ChallengeCycleUpdateRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());
        ChallengeCycle cycle = challengeCycleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengeCycle", "id", id));
        // name uniqueness if changed
        if (!cycle.getName().equalsIgnoreCase(request.getName()) &&
                challengeCycleRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Cycle name already exists");
        }
        cycle.setName(request.getName());
        cycle.setDescription(request.getDescription());
        cycle.setStartDate(request.getStartDate());
        cycle.setEndDate(request.getEndDate());
        cycle.setStatus(request.getStatus());
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
                .status(entity.getStatus())
                .build();
    }
}



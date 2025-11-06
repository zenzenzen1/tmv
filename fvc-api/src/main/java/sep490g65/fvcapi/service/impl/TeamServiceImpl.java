package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.team.TeamCreateRequest;
import sep490g65.fvcapi.dto.team.TeamDto;
import sep490g65.fvcapi.dto.team.TeamUpdateRequest;
import sep490g65.fvcapi.entity.ChallengeCycle;
import sep490g65.fvcapi.entity.Team;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.ChallengeCycleRepository;
import sep490g65.fvcapi.repository.TeamRepository;
import sep490g65.fvcapi.service.TeamService;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final ChallengeCycleRepository challengeCycleRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<TeamDto> listByCycle(String cycleId, String search, Pageable pageable) {
        Specification<Team> spec = (root, query, cb) -> 
            cb.equal(root.get("cycle").get("id"), cycleId);
        
        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            Specification<Team> searchSpec = (root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("code")), searchPattern),
                    cb.like(cb.lower(root.get("name")), searchPattern)
                );
            spec = spec.and(searchSpec);
        }
        
        return teamRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public TeamDto getById(String id) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Team", "id", id));
        return toDto(team);
    }

    @Override
    public TeamDto create(String cycleId, TeamCreateRequest request) {
        ChallengeCycle cycle = challengeCycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("ChallengeCycle", "id", cycleId));
        String codeUpper = request.getCode().toUpperCase();
        if (teamRepository.existsByCycle_IdAndCodeIgnoreCase(cycleId, codeUpper)) {
            throw new BusinessException("Team code already exists in cycle");
        }
        Team team = new Team();
        team.setCycle(cycle);
        team.setCode(codeUpper);
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        return toDto(teamRepository.save(team));
    }

    @Override
    public TeamDto update(String id, TeamUpdateRequest request) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Team", "id", id));
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        return toDto(teamRepository.save(team));
    }

    @Override
    public void delete(String id) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Team", "id", id));
        // Guarded deletion (members check) could be added when membership repo is present
        teamRepository.delete(team);
    }

    private TeamDto toDto(Team entity) {
        return TeamDto.builder()
                .id(entity.getId())
                .cycleId(entity.getCycle() != null ? entity.getCycle().getId() : null)
                .code(entity.getCode())
                .name(entity.getName())
                .description(entity.getDescription())
                .build();
    }
}



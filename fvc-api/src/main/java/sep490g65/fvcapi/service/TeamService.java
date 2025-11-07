package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.team.TeamCreateRequest;
import sep490g65.fvcapi.dto.team.TeamDto;
import sep490g65.fvcapi.dto.team.TeamUpdateRequest;

public interface TeamService {
    Page<TeamDto> listByCycle(String cycleId, String search, Pageable pageable);
    TeamDto getById(String id);
    TeamDto create(String cycleId, TeamCreateRequest request);
    TeamDto update(String id, TeamUpdateRequest request);
    void delete(String id);
}



package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleBulkCreateRequest;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleCreateRequest;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleDto;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleUpdateRequest;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;

public interface ChallengeCycleService {
    Page<ChallengeCycleDto> list(ChallengeCycleStatus status, String search, Pageable pageable);
    ChallengeCycleDto getById(String id);
    ChallengeCycleDto create(ChallengeCycleCreateRequest request);
    ChallengeCycleDto createBulk(ChallengeCycleBulkCreateRequest request);
    ChallengeCycleDto update(String id, ChallengeCycleUpdateRequest request);
    ChallengeCycleDto activate(String id);
    ChallengeCycleDto complete(String id);
    ChallengeCycleDto archive(String id);
}



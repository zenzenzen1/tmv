package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.phase.ChallengePhaseCreateRequest;
import sep490g65.fvcapi.dto.phase.ChallengePhaseDto;
import sep490g65.fvcapi.dto.phase.ChallengePhaseUpdateRequest;
import sep490g65.fvcapi.dto.phase.PhaseOrderUpdate;
import sep490g65.fvcapi.enums.PhaseStatus;

import java.util.List;

public interface ChallengePhaseService {
    Page<ChallengePhaseDto> listByCycle(String cycleId, PhaseStatus status, String search, Pageable pageable);
    ChallengePhaseDto getById(String id);
    ChallengePhaseDto create(String cycleId, ChallengePhaseCreateRequest request);
    ChallengePhaseDto update(String id, ChallengePhaseUpdateRequest request);
    void reorder(String cycleId, List<PhaseOrderUpdate> orderUpdates);
}



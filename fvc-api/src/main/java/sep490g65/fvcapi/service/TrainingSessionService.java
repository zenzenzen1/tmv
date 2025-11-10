package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.training.TrainingSessionCreateRequest;
import sep490g65.fvcapi.dto.training.TrainingSessionDto;
import sep490g65.fvcapi.dto.training.TrainingSessionUpdateRequest;
import sep490g65.fvcapi.enums.TrainingSessionStatus;

import java.time.LocalDateTime;

public interface TrainingSessionService {
    Page<TrainingSessionDto> list(String cycleId, String teamId, String phaseId, String locationId, 
                                  TrainingSessionStatus status, LocalDateTime startDate, LocalDateTime endDate, 
                                  Pageable pageable);
    Page<TrainingSessionDto> getCalendar(String cycleId, String teamId, String phaseId, 
                                        LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    TrainingSessionDto getById(String id);
    TrainingSessionDto create(TrainingSessionCreateRequest request);
    TrainingSessionDto update(String id, TrainingSessionUpdateRequest request);
    TrainingSessionDto updateStatus(String id, TrainingSessionStatus status);
    void delete(String id);
}



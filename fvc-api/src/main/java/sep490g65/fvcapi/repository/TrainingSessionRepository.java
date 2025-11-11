package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.TrainingSession;
import sep490g65.fvcapi.enums.TrainingSessionStatus;

import java.time.LocalDateTime;
import java.util.List;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, String>, JpaSpecificationExecutor<TrainingSession> {

    Page<TrainingSession> findByCycleId(String cycleId, Pageable pageable);

    Page<TrainingSession> findByCycleIdAndStatus(String cycleId, TrainingSessionStatus status, Pageable pageable);

    List<TrainingSession> findByPhaseId(String phaseId);

    Page<TrainingSession> findByTeamId(String teamId, Pageable pageable);

    Page<TrainingSession> findByLocationId(String locationId, Pageable pageable);

    @Query("SELECT ts FROM TrainingSession ts WHERE ts.startTime >= :startTime AND ts.endTime <= :endTime")
    Page<TrainingSession> findByStartTimeBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime, Pageable pageable);

    Page<TrainingSession> findByCycleIdAndTeamIdAndPhaseId(String cycleId, String teamId, String phaseId, Pageable pageable);

    @Query("SELECT ts FROM TrainingSession ts WHERE ts.cycle.id = :cycleId AND ts.team.id = :teamId AND ts.phase.id = :phaseId")
    Page<TrainingSession> findByCycleAndTeamAndPhase(@Param("cycleId") String cycleId, @Param("teamId") String teamId, @Param("phaseId") String phaseId, Pageable pageable);
}



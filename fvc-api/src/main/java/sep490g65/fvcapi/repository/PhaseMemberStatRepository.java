package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.PhaseMemberStat;

import java.util.List;
import java.util.Optional;

public interface PhaseMemberStatRepository extends JpaRepository<PhaseMemberStat, String>, JpaSpecificationExecutor<PhaseMemberStat> {

    Optional<PhaseMemberStat> findByPhase_IdAndUser_Id(String phaseId, String userId);

    List<PhaseMemberStat> findByPhase_Id(String phaseId);

    List<PhaseMemberStat> findByPhase_IdAndTeam_Id(String phaseId, String teamId);

    List<PhaseMemberStat> findByUser_IdAndPhase_Cycle_Id(String userId, String cycleId);

    @Query("SELECT pms FROM PhaseMemberStat pms WHERE pms.phase.id = :phaseId AND pms.user.id = :userId")
    Optional<PhaseMemberStat> findByPhaseAndUser(@Param("phaseId") String phaseId, @Param("userId") String userId);
}


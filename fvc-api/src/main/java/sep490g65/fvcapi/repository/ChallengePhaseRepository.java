package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import sep490g65.fvcapi.entity.ChallengePhase;

public interface ChallengePhaseRepository extends JpaRepository<ChallengePhase, String>, JpaSpecificationExecutor<ChallengePhase> {

    boolean existsByCycle_IdAndNameIgnoreCase(String cycleId, String name);
}



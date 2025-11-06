package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import sep490g65.fvcapi.entity.ChallengePhase;
import sep490g65.fvcapi.enums.PhaseStatus;

public interface ChallengePhaseRepository extends JpaRepository<ChallengePhase, String> {

    @Query("SELECT p FROM ChallengePhase p WHERE p.cycle.id = :cycleId AND (:status IS NULL OR p.status = :status) AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ChallengePhase> searchByCycle(String cycleId, PhaseStatus status, String search, Pageable pageable);

    boolean existsByCycle_IdAndNameIgnoreCase(String cycleId, String name);
}



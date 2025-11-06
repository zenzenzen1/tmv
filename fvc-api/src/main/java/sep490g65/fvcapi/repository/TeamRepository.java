package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import sep490g65.fvcapi.entity.Team;

public interface TeamRepository extends JpaRepository<Team, String> {

    boolean existsByCycle_IdAndCodeIgnoreCase(String cycleId, String code);

    @Query("SELECT t FROM Team t WHERE t.cycle.id = :cycleId AND (:search IS NULL OR LOWER(t.code) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Team> searchByCycle(String cycleId, String search, Pageable pageable);
}



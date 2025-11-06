package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import sep490g65.fvcapi.entity.ChallengeCycle;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;

public interface ChallengeCycleRepository extends JpaRepository<ChallengeCycle, String> {

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT c FROM ChallengeCycle c WHERE (:status IS NULL OR c.status = :status) AND (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ChallengeCycle> search(ChallengeCycleStatus status, String search, Pageable pageable);
}



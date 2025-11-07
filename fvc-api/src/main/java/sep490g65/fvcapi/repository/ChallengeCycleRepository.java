package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import sep490g65.fvcapi.entity.ChallengeCycle;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;

public interface ChallengeCycleRepository extends JpaRepository<ChallengeCycle, String>, JpaSpecificationExecutor<ChallengeCycle> {

    boolean existsByNameIgnoreCase(String name);
}



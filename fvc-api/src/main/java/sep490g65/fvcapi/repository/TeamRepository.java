package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import sep490g65.fvcapi.entity.Team;

public interface TeamRepository extends JpaRepository<Team, String>, JpaSpecificationExecutor<Team> {

    boolean existsByCycle_IdAndCodeIgnoreCase(String cycleId, String code);
}



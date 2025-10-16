package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sep490g65.fvcapi.entity.CompetitionOrder;

public interface CompetitionOrderRepository extends JpaRepository<CompetitionOrder, String> {
}



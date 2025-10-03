package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.Competition;

public interface CompetitionRepository extends JpaRepository<Competition, String> {

    @Query("SELECT c FROM Competition c WHERE (:q IS NULL OR LOWER(COALESCE(c.name, '')) LIKE :q)")
    Page<Competition> search(@Param("q") String keyword, Pageable pageable);
}



package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.MusicIntegratedPerformance;

import java.util.Optional;

public interface MusicIntegratedPerformanceRepository extends JpaRepository<MusicIntegratedPerformance, String> {

    @Query("SELECT m FROM MusicIntegratedPerformance m WHERE (:q IS NULL OR LOWER(COALESCE(m.name,'')) LIKE :q OR LOWER(COALESCE(m.description,'')) LIKE :q) AND (:active IS NULL OR m.isActive = :active)")
    Page<MusicIntegratedPerformance> search(@Param("q") String q,
                                            @Param("active") Boolean active,
                                            Pageable pageable);

    Optional<MusicIntegratedPerformance> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}



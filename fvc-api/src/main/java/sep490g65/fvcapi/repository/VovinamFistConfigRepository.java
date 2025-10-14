package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.VovinamFistConfig;

public interface VovinamFistConfigRepository extends JpaRepository<VovinamFistConfig, String> {

    @Query("SELECT v FROM VovinamFistConfig v WHERE " +
            "(:searchPattern IS NULL OR LOWER(v.name) LIKE :searchPattern OR LOWER(v.description) LIKE :searchPattern) AND " +
            "(:status IS NULL OR v.status = :status)")
    Page<VovinamFistConfig> search(@Param("searchPattern") String searchPattern,
                                   @Param("status") Boolean status,
                                   Pageable pageable);
}



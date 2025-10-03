package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.ApplicationFormConfig;

public interface ApplicationFormConfigRepository extends JpaRepository<ApplicationFormConfig, String> {

    @Query("SELECT f FROM ApplicationFormConfig f WHERE (:q IS NULL OR LOWER(f.name) LIKE :q)")
    Page<ApplicationFormConfig> search(@Param("q") String keyword, Pageable pageable);

    long countByCompetition_Id(String competitionId);

    @EntityGraph(attributePaths = {"fields", "competition"})
    java.util.Optional<ApplicationFormConfig> findWithFieldsById(String id);
}



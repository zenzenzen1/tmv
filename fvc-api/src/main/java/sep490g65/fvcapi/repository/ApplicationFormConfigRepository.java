package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationFormConfigRepository extends JpaRepository<ApplicationFormConfig, String> {

    @Query("SELECT afc FROM ApplicationFormConfig afc LEFT JOIN FETCH afc.fields ORDER BY afc.createdAt DESC")
    List<ApplicationFormConfig> findAllWithFields();

    @Query("SELECT afc FROM ApplicationFormConfig afc LEFT JOIN FETCH afc.fields WHERE afc.id = :id")
    Optional<ApplicationFormConfig> findByIdWithFields(@Param("id") String id);

    @Query("SELECT afc FROM ApplicationFormConfig afc LEFT JOIN FETCH afc.fields WHERE afc.formType = :formType")
    Optional<ApplicationFormConfig> findByFormTypeWithFields(@Param("formType") ApplicationFormType formType);

    Optional<ApplicationFormConfig> findByFormType(ApplicationFormType formType);

    @Query("SELECT f FROM ApplicationFormConfig f WHERE (:q IS NULL OR LOWER(f.name) LIKE :q)")
    Page<ApplicationFormConfig> search(@Param("q") String keyword, Pageable pageable);

    long countByCompetition_Id(String competitionId);

    @EntityGraph(attributePaths = {"fields", "competition"})
    Optional<ApplicationFormConfig> findWithFieldsById(String id);

    List<ApplicationFormConfig> findByEndDateBeforeAndStatus(LocalDateTime endDate, FormStatus status);

    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "(:search IS NULL OR LOWER(afc.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(afc.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:dateFrom IS NULL OR afc.createdAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR afc.createdAt <= :dateTo) AND " +
           "(:status IS NULL OR afc.status = :status)")
    Page<ApplicationFormConfig> findWithFilters(
        @Param("search") String search,
        @Param("dateFrom") LocalDateTime dateFrom,
        @Param("dateTo") LocalDateTime dateTo,
        @Param("status") FormStatus status,
        Pageable pageable
    );
}

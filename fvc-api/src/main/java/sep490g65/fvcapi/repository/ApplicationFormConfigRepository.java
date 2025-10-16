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
    
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE afc.formType = :formType ORDER BY afc.updatedAt DESC")
    List<ApplicationFormConfig> findByFormTypeOrderByUpdatedAtDesc(@Param("formType") ApplicationFormType formType);

    @Query("SELECT f FROM ApplicationFormConfig f WHERE (:q IS NULL OR LOWER(f.name) LIKE :q)")
    Page<ApplicationFormConfig> search(@Param("q") String keyword, Pageable pageable);

    long countByCompetition_Id(String competitionId);

    @EntityGraph(attributePaths = {"fields", "competition"})
    Optional<ApplicationFormConfig> findWithFieldsById(String id);

    List<ApplicationFormConfig> findByEndDateBeforeAndStatus(LocalDateTime endDate, FormStatus status);

    boolean existsByName(String name);

    // Simple search by name or description - ONLY CLUB_REGISTRATION
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "afc.formType = 'CLUB_REGISTRATION' AND " +
           "(LOWER(afc.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(afc.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ApplicationFormConfig> findBySearch(@Param("search") String search, Pageable pageable);
    
    // Filter by status - ONLY CLUB_REGISTRATION
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "afc.formType = 'CLUB_REGISTRATION' AND afc.status = :status")
    Page<ApplicationFormConfig> findByStatus(@Param("status") FormStatus status, Pageable pageable);
    
    // Filter by date range - ONLY CLUB_REGISTRATION
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "afc.formType = 'CLUB_REGISTRATION' AND " +
           "afc.createdAt >= :dateFrom AND afc.createdAt <= :dateTo")
    Page<ApplicationFormConfig> findByDateRange(
        @Param("dateFrom") LocalDateTime dateFrom, 
        @Param("dateTo") LocalDateTime dateTo, 
        Pageable pageable
    );
    
    // Combined filters - ONLY CLUB_REGISTRATION
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "afc.formType = 'CLUB_REGISTRATION' AND " +
           "LOWER(afc.name) LIKE LOWER(CONCAT('%', :search, '%')) AND " +
           "afc.status = :status")
    Page<ApplicationFormConfig> findBySearchAndStatus(
        @Param("search") String search, 
        @Param("status") FormStatus status, 
        Pageable pageable
    );
    
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "afc.formType = 'CLUB_REGISTRATION' AND " +
           "LOWER(afc.name) LIKE LOWER(CONCAT('%', :search, '%')) AND " +
           "afc.createdAt >= :dateFrom AND afc.createdAt <= :dateTo")
    Page<ApplicationFormConfig> findBySearchAndDateRange(
        @Param("search") String search,
        @Param("dateFrom") LocalDateTime dateFrom, 
        @Param("dateTo") LocalDateTime dateTo, 
        Pageable pageable
    );
    
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "afc.formType = 'CLUB_REGISTRATION' AND " +
           "afc.status = :status AND " +
           "afc.createdAt >= :dateFrom AND afc.createdAt <= :dateTo")
    Page<ApplicationFormConfig> findByStatusAndDateRange(
        @Param("status") FormStatus status,
        @Param("dateFrom") LocalDateTime dateFrom, 
        @Param("dateTo") LocalDateTime dateTo, 
        Pageable pageable
    );
    
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE " +
           "afc.formType = 'CLUB_REGISTRATION' AND " +
           "LOWER(afc.name) LIKE LOWER(CONCAT('%', :search, '%')) AND " +
           "afc.status = :status AND " +
           "afc.createdAt >= :dateFrom AND afc.createdAt <= :dateTo")
    Page<ApplicationFormConfig> findByAllFilters(
        @Param("search") String search,
        @Param("status") FormStatus status,
        @Param("dateFrom") LocalDateTime dateFrom, 
        @Param("dateTo") LocalDateTime dateTo, 
        Pageable pageable
    );
    
    // Get all CLUB_REGISTRATION forms
    @Query("SELECT afc FROM ApplicationFormConfig afc WHERE afc.formType = 'CLUB_REGISTRATION'")
    Page<ApplicationFormConfig> findAllClubRegistration(Pageable pageable);

    Optional<ApplicationFormConfig> findByPublicSlug(String publicSlug);
    boolean existsByPublicSlug(String publicSlug);
}

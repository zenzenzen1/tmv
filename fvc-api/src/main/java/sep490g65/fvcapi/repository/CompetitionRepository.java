package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.enums.TournamentStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, String> {
    
    @Query("SELECT c FROM Competition c WHERE " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:year IS NULL OR YEAR(c.startDate) = :year) AND " +
           "(:location IS NULL OR LOWER(c.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    Page<Competition> findCompetitionsWithFilters(
            @Param("search") String search,
            @Param("status") TournamentStatus status,
            @Param("year") Integer year,
            @Param("location") String location,
            Pageable pageable);
    
    @Query("SELECT c FROM Competition c WHERE c.status = :status")
    List<Competition> findByStatus(@Param("status") TournamentStatus status);
    
    @Query("SELECT c FROM Competition c WHERE YEAR(c.startDate) = :year")
    List<Competition> findByYear(@Param("year") Integer year);
    
    @Query("SELECT c FROM Competition c WHERE c.startDate >= :startDate AND c.endDate <= :endDate")
    List<Competition> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT DISTINCT YEAR(c.startDate) FROM Competition c ORDER BY YEAR(c.startDate) DESC")
    List<Integer> findDistinctYears();
    
    @Query("SELECT DISTINCT c.location FROM Competition c WHERE c.location IS NOT NULL ORDER BY c.location")
    List<String> findDistinctLocations();
    
    Optional<Competition> findByName(String name);
    
    boolean existsByName(String name);
}


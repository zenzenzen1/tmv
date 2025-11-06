package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.Performance;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceRepository extends JpaRepository<Performance, String> {
    
    List<Performance> findByCompetitionId(String competitionId);
    
    List<Performance> findByCompetitionIdAndPerformanceType(String competitionId, Performance.PerformanceType performanceType);
    
    List<Performance> findByCompetitionIdAndContentType(String competitionId, Performance.ContentType contentType);
    
    List<Performance> findByStatus(Performance.PerformanceStatus status);
    
    @Query("SELECT p FROM Performance p WHERE p.competition.id = :competitionId AND p.isTeam = :isTeam")
    List<Performance> findByCompetitionIdAndIsTeam(@Param("competitionId") String competitionId, @Param("isTeam") Boolean isTeam);
    
    @Query("SELECT p FROM Performance p WHERE p.competition.id = :competitionId AND p.teamId = :teamId")
    Optional<Performance> findByCompetitionIdAndTeamId(@Param("competitionId") String competitionId, @Param("teamId") String teamId);
    
    @Query("SELECT p FROM Performance p WHERE p.competition.id = :competitionId ORDER BY p.createdAt ASC")
    List<Performance> findByCompetitionIdOrderByCreatedAt(@Param("competitionId") String competitionId);
}
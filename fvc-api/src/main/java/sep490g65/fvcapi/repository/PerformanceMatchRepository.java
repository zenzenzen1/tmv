package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.entity.PerformanceMatch;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceMatchRepository extends JpaRepository<PerformanceMatch, String> {
    
    List<PerformanceMatch> findByCompetitionId(String competitionId);
    
    Optional<PerformanceMatch> findByPerformanceId(String performanceId);
    
    @Query("SELECT pm FROM PerformanceMatch pm WHERE pm.competition.id = :competitionId AND pm.contentType = :contentType")
    List<PerformanceMatch> findByCompetitionIdAndContentType(@Param("competitionId") String competitionId, @Param("contentType") Performance.ContentType contentType);
    
    @Query("SELECT pm FROM PerformanceMatch pm WHERE pm.competition.id = :competitionId ORDER BY pm.matchOrder ASC")
    List<PerformanceMatch> findByCompetitionIdOrderByMatchOrder(@Param("competitionId") String competitionId);
    
    @Query("SELECT pm FROM PerformanceMatch pm WHERE pm.status = :status")
    List<PerformanceMatch> findByStatus(@Param("status") PerformanceMatch.MatchStatus status);
    
    @Query("SELECT pm FROM PerformanceMatch pm WHERE pm.competition.id = :competitionId AND pm.status = :status")
    List<PerformanceMatch> findByCompetitionIdAndStatus(@Param("competitionId") String competitionId, @Param("status") PerformanceMatch.MatchStatus status);
}


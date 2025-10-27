package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.PerformanceAthlete;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceAthleteRepository extends JpaRepository<PerformanceAthlete, String> {
    
    @Query("SELECT pa FROM PerformanceAthlete pa WHERE pa.performance.id = :performanceId")
    List<PerformanceAthlete> findByPerformanceId(@Param("performanceId") String performanceId);
    
    @Query("SELECT pa FROM PerformanceAthlete pa WHERE pa.athlete.id = :athleteId")
    List<PerformanceAthlete> findByAthleteId(@Param("athleteId") java.util.UUID athleteId);
    
    @Query("SELECT pa FROM PerformanceAthlete pa WHERE pa.performance.id = :performanceId ORDER BY pa.teamPosition ASC")
    List<PerformanceAthlete> findByPerformanceIdOrderByTeamPosition(@Param("performanceId") String performanceId);
    
    @Query("SELECT pa FROM PerformanceAthlete pa WHERE pa.performance.id = :performanceId AND pa.isCaptain = true")
    Optional<PerformanceAthlete> findCaptainByPerformanceId(@Param("performanceId") String performanceId);
    
    @Query("SELECT pa FROM PerformanceAthlete pa WHERE pa.athlete.id = :athleteId AND pa.performance.competition.id = :competitionId")
    List<PerformanceAthlete> findByAthleteIdAndCompetitionId(@Param("athleteId") java.util.UUID athleteId, @Param("competitionId") String competitionId);
    
    @Query("SELECT pa FROM PerformanceAthlete pa WHERE pa.performance.id = :performanceId AND pa.athlete.id = :athleteId")
    Optional<PerformanceAthlete> findByPerformanceIdAndAthleteId(@Param("performanceId") String performanceId, @Param("athleteId") java.util.UUID athleteId);
    
    @Query("SELECT COUNT(pa) > 0 FROM PerformanceAthlete pa WHERE pa.performance.id = :performanceId AND pa.athlete.id = :athleteId")
    boolean existsByPerformanceIdAndAthleteId(@Param("performanceId") String performanceId, @Param("athleteId") java.util.UUID athleteId);
}

package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.AssessorScore;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssessorScoreRepository extends JpaRepository<AssessorScore, String> {
    
    List<AssessorScore> findByPerformanceId(String performanceId);
    
    List<AssessorScore> findByAssessorId(String assessorId);
    
    @Query("SELECT as FROM AssessorScore as WHERE as.performance.id = :performanceId ORDER BY as.submittedAt ASC")
    List<AssessorScore> findByPerformanceIdOrderBySubmittedAt(@Param("performanceId") String performanceId);
    
    @Query("SELECT as FROM AssessorScore as WHERE as.performance.id = :performanceId AND as.assessor.id = :assessorId")
    Optional<AssessorScore> findByPerformanceIdAndAssessorId(@Param("performanceId") String performanceId, @Param("assessorId") String assessorId);
    
    boolean existsByPerformanceIdAndAssessorId(String performanceId, String assessorId);
    
    @Query("SELECT AVG(as.score) FROM AssessorScore as WHERE as.performance.id = :performanceId")
    BigDecimal calculateAverageScoreByPerformanceId(@Param("performanceId") String performanceId);
    
    @Query("SELECT COUNT(as) FROM AssessorScore as WHERE as.performance.id = :performanceId")
    long countByPerformanceId(@Param("performanceId") String performanceId);
    
    @Query("SELECT as FROM AssessorScore as WHERE as.performance.competition.id = :competitionId ORDER BY as.submittedAt DESC")
    List<AssessorScore> findByCompetitionIdOrderBySubmittedAt(@Param("competitionId") String competitionId);
}

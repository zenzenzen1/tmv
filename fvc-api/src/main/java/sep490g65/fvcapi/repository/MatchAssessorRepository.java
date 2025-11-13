package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.enums.AssessorRole;

import java.util.List;
import java.util.Optional;

public interface MatchAssessorRepository extends JpaRepository<MatchAssessor, String> {
    
    // Match-level queries (đối kháng)
    List<MatchAssessor> findByMatchId(String matchId);
    
    List<MatchAssessor> findByMatchIdOrderByPositionAsc(String matchId);
    
    Optional<MatchAssessor> findByMatchIdAndPosition(String matchId, Integer position);
    
    Optional<MatchAssessor> findByMatchIdAndUserId(String matchId, String userId);
    
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.match.id = :matchId AND ma.role = :role ORDER BY ma.position ASC")
    List<MatchAssessor> findByMatchIdAndRole(@Param("matchId") String matchId, @Param("role") AssessorRole role);
    
    boolean existsByMatchIdAndPosition(String matchId, Integer position);
    
    boolean existsByMatchIdAndUserId(String matchId, String userId);
    
    long countByMatchId(String matchId);
    
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM MatchAssessor ma WHERE ma.match.id = :matchId")
    void deleteAllByMatchId(@Param("matchId") String matchId);
    
    // User-level queries
    List<MatchAssessor> findByUserId(String userId);
    
    @Query("SELECT DISTINCT ma FROM MatchAssessor ma " +
           "LEFT JOIN FETCH ma.match m " +
           "LEFT JOIN FETCH ma.performanceMatch pm " +
           "LEFT JOIN FETCH pm.competition c " +
           "LEFT JOIN FETCH pm.performance p " +
           "WHERE ma.user.id = :userId")
    List<MatchAssessor> findByUserIdWithRelations(@Param("userId") String userId);
    
    // Performance-level queries (quyền/võ nhạc)
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.performance.id = :performanceId")
    List<MatchAssessor> findByPerformanceId(@Param("performanceId") String performanceId);
    
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.performance.id = :performanceId AND ma.specialization = :specialization")
    List<MatchAssessor> findByPerformanceIdAndSpecialization(@Param("performanceId") String performanceId, @Param("specialization") MatchAssessor.Specialization specialization);
    
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.user.id = :userId AND ma.performance.id = :performanceId")
    Optional<MatchAssessor> findByUserIdAndPerformanceId(@Param("userId") String userId, @Param("performanceId") String performanceId);
    
    boolean existsByUserIdAndPerformanceId(String userId, String performanceId);
    
    @Query("SELECT COUNT(ma) FROM MatchAssessor ma WHERE ma.performance.id = :performanceId AND ma.specialization = :specialization")
    long countByPerformanceIdAndSpecialization(@Param("performanceId") String performanceId, @Param("specialization") MatchAssessor.Specialization specialization);
    
    // PerformanceMatch-level queries (quyền/võ nhạc)
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.performanceMatch.id = :performanceMatchId")
    List<MatchAssessor> findByPerformanceMatchId(@Param("performanceMatchId") String performanceMatchId);
    
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.performanceMatch.id = :performanceMatchId AND ma.specialization = :specialization")
    List<MatchAssessor> findByPerformanceMatchIdAndSpecialization(@Param("performanceMatchId") String performanceMatchId, @Param("specialization") MatchAssessor.Specialization specialization);
    
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.user.id = :userId AND ma.performanceMatch.id = :performanceMatchId")
    Optional<MatchAssessor> findByUserIdAndPerformanceMatchId(@Param("userId") String userId, @Param("performanceMatchId") String performanceMatchId);
    
    boolean existsByUserIdAndPerformanceMatchId(String userId, String performanceMatchId);
    
    @Query("SELECT COUNT(ma) FROM MatchAssessor ma WHERE ma.performanceMatch.id = :performanceMatchId AND ma.specialization = :specialization")
    long countByPerformanceMatchIdAndSpecialization(@Param("performanceMatchId") String performanceMatchId, @Param("specialization") MatchAssessor.Specialization specialization);
    
    // General queries
    List<MatchAssessor> findByRole(AssessorRole role);
    
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.specialization = :specialization")
    List<MatchAssessor> findBySpecialization(@Param("specialization") MatchAssessor.Specialization specialization);
}


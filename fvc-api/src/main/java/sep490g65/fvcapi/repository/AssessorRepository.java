package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.Assessor;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessorRepository extends JpaRepository<Assessor, String> {
    
    List<Assessor> findByUserId(String userId);
    
    // Performance-level assessors (quyền/võ nhạc)
    @Query("SELECT a FROM Assessor a WHERE a.performance.id = :performanceId")
    List<Assessor> findByPerformanceId(@Param("performanceId") String performanceId);
    
    @Query("SELECT a FROM Assessor a WHERE a.performance.id = :performanceId AND a.specialization = :specialization")
    List<Assessor> findByPerformanceIdAndSpecialization(@Param("performanceId") String performanceId, @Param("specialization") Assessor.Specialization specialization);
    
    @Query("SELECT a FROM Assessor a WHERE a.user.id = :userId AND a.performance.id = :performanceId")
    Optional<Assessor> findByUserIdAndPerformanceId(@Param("userId") String userId, @Param("performanceId") String performanceId);
    
    boolean existsByUserIdAndPerformanceId(String userId, String performanceId);
    
    @Query("SELECT COUNT(a) FROM Assessor a WHERE a.performance.id = :performanceId AND a.specialization = :specialization")
    long countByPerformanceIdAndSpecialization(@Param("performanceId") String performanceId, @Param("specialization") Assessor.Specialization specialization);
    
    // Performance match assessors (quyền/võ nhạc) - via performance_match_id
    @Query("SELECT a FROM Assessor a WHERE a.performanceMatch.id = :performanceMatchId")
    List<Assessor> findByPerformanceMatchId(@Param("performanceMatchId") String performanceMatchId);
    
    @Query("SELECT a FROM Assessor a WHERE a.performanceMatch.id = :performanceMatchId AND a.specialization = :specialization")
    List<Assessor> findByPerformanceMatchIdAndSpecialization(@Param("performanceMatchId") String performanceMatchId, @Param("specialization") Assessor.Specialization specialization);
    
    @Query("SELECT a FROM Assessor a WHERE a.user.id = :userId AND a.performanceMatch.id = :performanceMatchId")
    Optional<Assessor> findByUserIdAndPerformanceMatchId(@Param("userId") String userId, @Param("performanceMatchId") String performanceMatchId);
    
    boolean existsByUserIdAndPerformanceMatchId(String userId, String performanceMatchId);
    
    @Query("SELECT COUNT(a) FROM Assessor a WHERE a.performanceMatch.id = :performanceMatchId AND a.specialization = :specialization")
    long countByPerformanceMatchIdAndSpecialization(@Param("performanceMatchId") String performanceMatchId, @Param("specialization") Assessor.Specialization specialization);
    
    // Match-level assessors (đối kháng/sparring)
    @Query("SELECT a FROM Assessor a WHERE a.matchId = :matchId")
    List<Assessor> findByMatchId(@Param("matchId") String matchId);
    
    @Query("SELECT a FROM Assessor a WHERE a.matchId = :matchId ORDER BY a.position ASC")
    List<Assessor> findByMatchIdOrderByPosition(@Param("matchId") String matchId);
    
    @Query("SELECT a FROM Assessor a WHERE a.matchId = :matchId AND a.role = :role")
    List<Assessor> findByMatchIdAndRole(@Param("matchId") String matchId, @Param("role") Assessor.MatchRole role);
    
    @Query("SELECT a FROM Assessor a WHERE a.matchId = :matchId AND a.user.id = :userId AND a.role = :role")
    Optional<Assessor> findByMatchIdAndUserIdAndRole(
        @Param("matchId") String matchId, 
        @Param("userId") String userId, 
        @Param("role") Assessor.MatchRole role
    );
    
    @Query("SELECT a FROM Assessor a WHERE a.user.id = :userId AND a.matchId = :matchId")
    Optional<Assessor> findByUserIdAndMatchId(@Param("userId") String userId, @Param("matchId") String matchId);
    
    boolean existsByUserIdAndMatchId(String userId, String matchId);
    
    @Query("SELECT COUNT(a) FROM Assessor a WHERE a.matchId = :matchId AND a.role = :role")
    long countByMatchIdAndRole(@Param("matchId") String matchId, @Param("role") Assessor.MatchRole role);
    
    // General queries
    @Query("SELECT a FROM Assessor a WHERE a.specialization = :specialization")
    List<Assessor> findBySpecialization(@Param("specialization") Assessor.Specialization specialization);
}

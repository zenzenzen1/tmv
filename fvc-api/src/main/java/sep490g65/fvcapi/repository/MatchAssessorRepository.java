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
    
    List<MatchAssessor> findByMatchId(String matchId);
    
    List<MatchAssessor> findByMatchIdOrderByPositionAsc(String matchId);
    
    Optional<MatchAssessor> findByMatchIdAndPosition(String matchId, Integer position);
    
    Optional<MatchAssessor> findByMatchIdAndUserId(String matchId, String userId);
    
    List<MatchAssessor> findByUserId(String userId);
    
    @Query("SELECT DISTINCT ma FROM MatchAssessor ma " +
           "LEFT JOIN FETCH ma.match m " +
           "LEFT JOIN FETCH ma.performanceMatch pm " +
           "LEFT JOIN FETCH pm.competition c " +
           "LEFT JOIN FETCH pm.performance p " +
           "LEFT JOIN FETCH p.athletes pa " +
           "LEFT JOIN FETCH pa.athlete a " +
           "WHERE ma.user.id = :userId")
    List<MatchAssessor> findByUserIdWithRelations(@Param("userId") String userId);
    
    List<MatchAssessor> findByRole(AssessorRole role);
    
    @Query("SELECT ma FROM MatchAssessor ma WHERE ma.match.id = :matchId AND ma.role = :role ORDER BY ma.position ASC")
    List<MatchAssessor> findByMatchIdAndRole(@Param("matchId") String matchId, @Param("role") AssessorRole role);
    
    boolean existsByMatchIdAndPosition(String matchId, Integer position);
    
    boolean existsByMatchIdAndUserId(String matchId, String userId);
    
    long countByMatchId(String matchId);
    
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM MatchAssessor ma WHERE ma.match.id = :matchId")
    void deleteAllByMatchId(@Param("matchId") String matchId);
}


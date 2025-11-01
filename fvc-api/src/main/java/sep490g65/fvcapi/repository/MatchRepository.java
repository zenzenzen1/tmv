package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.Match;
import sep490g65.fvcapi.enums.MatchStatus;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, String> {
    
    Optional<Match> findByIdAndDeletedAtIsNull(String id);
    
    List<Match> findByCompetitionIdAndDeletedAtIsNull(String competitionId);
    
    List<Match> findByStatusAndDeletedAtIsNull(MatchStatus status);
    
    @Query("SELECT m FROM Match m WHERE m.competitionId = :competitionId AND m.deletedAt IS NULL ORDER BY m.createdAt DESC")
    List<Match> findActiveMatchesByCompetition(@Param("competitionId") String competitionId);
}


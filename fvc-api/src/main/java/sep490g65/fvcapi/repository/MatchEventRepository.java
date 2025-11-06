package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.MatchEvent;

import java.util.List;
import java.util.Optional;

public interface MatchEventRepository extends JpaRepository<MatchEvent, String> {
    
    @Query("SELECT e FROM MatchEvent e WHERE e.match.id = :matchId ORDER BY e.createdAt ASC")
    List<MatchEvent> findByMatchIdOrderByCreatedAtAsc(@Param("matchId") String matchId);
    
    @Query("SELECT e FROM MatchEvent e WHERE e.match.id = :matchId ORDER BY e.createdAt DESC")
    List<MatchEvent> findByMatchIdOrderByCreatedAtDesc(@Param("matchId") String matchId);
    
    @Query("SELECT e FROM MatchEvent e WHERE e.match.id = :matchId ORDER BY e.createdAt DESC")
    List<MatchEvent> findLatestEventsByMatchId(@Param("matchId") String matchId);
    
    @Query("SELECT e FROM MatchEvent e WHERE e.match.id = :matchId ORDER BY e.createdAt DESC")
    Optional<MatchEvent> findFirstByMatchIdOrderByCreatedAtDesc(@Param("matchId") String matchId);
}


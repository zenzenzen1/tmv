package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.MatchScoreboardSnapshot;

import java.util.Optional;

@Repository
public interface MatchScoreboardSnapshotRepository extends JpaRepository<MatchScoreboardSnapshot, String> {
    
    Optional<MatchScoreboardSnapshot> findByMatchId(String matchId);
}


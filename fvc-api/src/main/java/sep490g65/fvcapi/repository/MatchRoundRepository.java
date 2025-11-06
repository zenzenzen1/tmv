package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.MatchRound;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRoundRepository extends JpaRepository<MatchRound, String> {

    @Query("SELECT mr FROM MatchRound mr WHERE mr.matchId = :matchId ORDER BY mr.roundNumber ASC")
    List<MatchRound> findByMatchIdOrderByRoundNumberAsc(@Param("matchId") String matchId);

    @Query("SELECT mr FROM MatchRound mr WHERE mr.matchId = :matchId AND mr.roundNumber = :roundNumber")
    Optional<MatchRound> findByMatchIdAndRoundNumber(@Param("matchId") String matchId, @Param("roundNumber") Integer roundNumber);

    @Query("SELECT mr FROM MatchRound mr WHERE mr.matchId = :matchId AND mr.status = 'IN_PROGRESS'")
    Optional<MatchRound> findCurrentRoundByMatchId(@Param("matchId") String matchId);

    @Query("SELECT COUNT(mr) FROM MatchRound mr WHERE mr.matchId = :matchId")
    long countByMatchId(@Param("matchId") String matchId);
}


package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.CompetitionMusicIntegratedPerformance;

import java.util.List;

@Repository
public interface CompetitionMusicIntegratedPerformanceRepository extends JpaRepository<CompetitionMusicIntegratedPerformance, String> {

    @Query("SELECT cmip FROM CompetitionMusicIntegratedPerformance cmip WHERE cmip.competition.id = :competitionId")
    List<CompetitionMusicIntegratedPerformance> findByCompetitionId(@Param("competitionId") String competitionId);

    void deleteByCompetitionId(String competitionId);

    @Query("SELECT cmip FROM CompetitionMusicIntegratedPerformance cmip WHERE cmip.musicIntegratedPerformance.id = :musicPerformanceId")
    List<CompetitionMusicIntegratedPerformance> findByMusicPerformanceId(@Param("musicPerformanceId") String musicPerformanceId);
}

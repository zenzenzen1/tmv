package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.CompetitionFistItemSelection;

import java.util.List;

@Repository
public interface CompetitionFistItemSelectionRepository extends JpaRepository<CompetitionFistItemSelection, String> {

    @Query("SELECT cfis FROM CompetitionFistItemSelection cfis WHERE cfis.competition.id = :competitionId")
    List<CompetitionFistItemSelection> findByCompetitionId(@Param("competitionId") String competitionId);

    @Query("SELECT cfis FROM CompetitionFistItemSelection cfis WHERE " +
           "cfis.competition.id = :competitionId AND cfis.vovinamFistConfig.id = :fistConfigId")
    List<CompetitionFistItemSelection> findByCompetitionIdAndFistConfigId(
            @Param("competitionId") String competitionId,
            @Param("fistConfigId") String fistConfigId);

    void deleteByCompetitionId(String competitionId);

    void deleteByCompetitionIdAndVovinamFistConfigId(String competitionId, String fistConfigId);
}

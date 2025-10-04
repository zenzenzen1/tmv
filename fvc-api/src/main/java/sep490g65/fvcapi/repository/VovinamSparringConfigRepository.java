package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.VovinamSparringConfig;

import java.util.List;
import java.util.Optional;

@Repository
public interface VovinamSparringConfigRepository extends JpaRepository<VovinamSparringConfig, String> {

    @Query("SELECT vsc FROM VovinamSparringConfig vsc WHERE vsc.competition.id = :competitionId")
    Optional<VovinamSparringConfig> findByCompetitionId(@Param("competitionId") String competitionId);

    @Query("SELECT vsc FROM VovinamSparringConfig vsc WHERE vsc.competition.id = :competitionId")
    List<VovinamSparringConfig> findAllByCompetitionId(@Param("competitionId") String competitionId);

    void deleteByCompetitionId(String competitionId);
}

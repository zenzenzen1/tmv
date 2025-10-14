package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.VovinamSparringConfigWeightClass;

import java.util.List;

@Repository
public interface VovinamSparringConfigWeightClassRepository extends JpaRepository<VovinamSparringConfigWeightClass, String> {

    @Query("SELECT vscwc FROM VovinamSparringConfigWeightClass vscwc WHERE vscwc.vovinamSparringConfig.id = :sparringConfigId")
    List<VovinamSparringConfigWeightClass> findBySparringConfigId(@Param("sparringConfigId") String sparringConfigId);

    @Query("SELECT vscwc FROM VovinamSparringConfigWeightClass vscwc WHERE vscwc.vovinamSparringConfig.competition.id = :competitionId")
    List<VovinamSparringConfigWeightClass> findByCompetitionId(@Param("competitionId") String competitionId);

    void deleteByVovinamSparringConfigId(String sparringConfigId);

    void deleteByVovinamSparringConfigCompetitionId(String competitionId);
}

package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.DrawSession;

import java.util.List;
import java.util.Optional;

@Repository
public interface DrawSessionRepository extends JpaRepository<DrawSession, String> {

    @Query("SELECT ds FROM DrawSession ds WHERE ds.competitionId = :competitionId AND ds.weightClassId = :weightClassId ORDER BY ds.drawDate DESC")
    List<DrawSession> findByCompetitionAndWeightClass(@Param("competitionId") String competitionId, 
                                                      @Param("weightClassId") String weightClassId);

    @Query("SELECT ds FROM DrawSession ds WHERE ds.competitionId = :competitionId AND ds.weightClassId = :weightClassId AND ds.isFinal = true")
    Optional<DrawSession> findFinalDrawSession(@Param("competitionId") String competitionId, 
                                              @Param("weightClassId") String weightClassId);

    @Query("SELECT ds FROM DrawSession ds WHERE ds.competitionId = :competitionId ORDER BY ds.drawDate DESC")
    List<DrawSession> findByCompetition(@Param("competitionId") String competitionId);
}

package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.DrawResult;

import java.util.List;

@Repository
public interface DrawResultRepository extends JpaRepository<DrawResult, String> {

    @Query("SELECT dr FROM DrawResult dr WHERE dr.drawSessionId = :drawSessionId ORDER BY dr.seedNumber")
    List<DrawResult> findByDrawSessionIdOrderBySeedNumber(@Param("drawSessionId") String drawSessionId);

    @Query("SELECT dr FROM DrawResult dr WHERE dr.drawSessionId = :drawSessionId AND dr.athleteId = :athleteId")
    List<DrawResult> findByDrawSessionIdAndAthleteId(@Param("drawSessionId") String drawSessionId, 
                                                     @Param("athleteId") String athleteId);
}

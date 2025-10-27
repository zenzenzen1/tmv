package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.Assessor;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessorRepository extends JpaRepository<Assessor, String> {
    
    List<Assessor> findByCompetitionId(String competitionId);
    
    List<Assessor> findByUserId(String userId);
    
    @Query("SELECT a FROM Assessor a WHERE a.competition.id = :competitionId AND a.specialization = :specialization")
    List<Assessor> findByCompetitionIdAndSpecialization(@Param("competitionId") String competitionId, @Param("specialization") Assessor.Specialization specialization);
    
    @Query("SELECT a FROM Assessor a WHERE a.user.id = :userId AND a.competition.id = :competitionId")
    Optional<Assessor> findByUserIdAndCompetitionId(@Param("userId") String userId, @Param("competitionId") String competitionId);
    
    boolean existsByUserIdAndCompetitionId(String userId, String competitionId);
    
    @Query("SELECT COUNT(a) FROM Assessor a WHERE a.competition.id = :competitionId AND a.specialization = :specialization")
    long countByCompetitionIdAndSpecialization(@Param("competitionId") String competitionId, @Param("specialization") Assessor.Specialization specialization);
}

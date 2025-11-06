package sep490g65.fvcapi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import sep490g65.fvcapi.entity.Athlete;

import java.util.Optional;
import java.util.List;

public interface AthleteRepository extends JpaRepository<Athlete, java.util.UUID>, JpaSpecificationExecutor<Athlete> {
    Optional<Athlete> findByCompetitionIdAndEmail(String competitionId, String email);

    Page<Athlete> findByCompetitionId(String competitionId, Pageable pageable);

    Page<Athlete> findByCompetitionType(Athlete.CompetitionType competitionType, Pageable pageable);

    Page<Athlete> findByCompetitionIdAndCompetitionType(String competitionId, Athlete.CompetitionType competitionType, Pageable pageable);

    List<Athlete> findByCompetitionIdAndCompetitionType(String competitionId, Athlete.CompetitionType competitionType);

    void deleteByEmailAndCompetitionId(String email, String competitionId);
    
    List<Athlete> findByCompetitionIdAndCompetitionTypeAndWeightClassId(
        String competitionId, 
        Athlete.CompetitionType competitionType, 
        String weightClassId
    );
}



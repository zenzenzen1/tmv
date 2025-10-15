package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import sep490g65.fvcapi.entity.Athlete;

import java.util.Optional;

public interface AthleteRepository extends JpaRepository<Athlete, java.util.UUID>, JpaSpecificationExecutor<Athlete> {
    Optional<Athlete> findByTournamentIdAndEmail(String tournamentId, String email);

    Page<Athlete> findByTournamentId(String tournamentId, Pageable pageable);

    Page<Athlete> findByCompetitionType(Athlete.CompetitionType competitionType, Pageable pageable);

    Page<Athlete> findByTournamentIdAndCompetitionType(String tournamentId, Athlete.CompetitionType competitionType, Pageable pageable);
}



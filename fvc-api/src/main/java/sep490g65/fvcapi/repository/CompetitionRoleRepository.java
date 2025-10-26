package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.CompetitionRole;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.CompetitionRoleType;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetitionRoleRepository extends JpaRepository<CompetitionRole, String> {

    List<CompetitionRole> findByCompetitionId(String competitionId);

    List<CompetitionRole> findByUserId(String userId);

    List<CompetitionRole> findByCompetitionIdAndRole(String competitionId, CompetitionRoleType role);

    List<CompetitionRole> findByUserIdAndRole(String userId, CompetitionRoleType role);

    Optional<CompetitionRole> findByCompetitionIdAndUserIdAndRole(String competitionId, String userId, CompetitionRoleType role);

    boolean existsByCompetitionIdAndUserIdAndRole(String competitionId, String userId, CompetitionRoleType role);
    
    boolean existsByCompetitionIdAndEmailAndRole(String competitionId, String email, CompetitionRoleType role);
}

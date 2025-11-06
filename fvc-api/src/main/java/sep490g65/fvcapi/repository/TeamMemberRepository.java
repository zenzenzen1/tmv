package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import sep490g65.fvcapi.entity.TeamMember;

public interface TeamMemberRepository extends JpaRepository<TeamMember, String> {

    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND (:activeOnly = false OR tm.status = 'ACTIVE')")
    Page<TeamMember> findByTeam(String teamId, boolean activeOnly, Pageable pageable);

    @Query("SELECT COUNT(tm) > 0 FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId AND tm.status = 'ACTIVE'")
    boolean existsActiveMembership(String teamId, String userId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.user.id = :userId ORDER BY tm.joinedAt DESC")
    Page<TeamMember> findHistoryByUser(String userId, Pageable pageable);
}



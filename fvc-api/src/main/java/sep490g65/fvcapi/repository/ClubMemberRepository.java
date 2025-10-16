package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import sep490g65.fvcapi.entity.ClubMember;

public interface ClubMemberRepository extends JpaRepository<ClubMember, String>, JpaSpecificationExecutor<ClubMember> {
    boolean existsByEmailIgnoreCase(String email);
}



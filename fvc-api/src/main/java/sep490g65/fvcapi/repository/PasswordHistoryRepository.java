package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.PasswordHistory;
import sep490g65.fvcapi.entity.User;

import java.util.List;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, String> {
    List<PasswordHistory> findTop3ByUserOrderByChangedAtDesc(User user);
}



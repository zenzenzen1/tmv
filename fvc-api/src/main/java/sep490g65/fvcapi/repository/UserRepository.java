package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sep490g65.fvcapi.entity.User;

public interface UserRepository extends JpaRepository<User, String> {
    java.util.Optional<User> findByPersonalMail(String personalMail);
}

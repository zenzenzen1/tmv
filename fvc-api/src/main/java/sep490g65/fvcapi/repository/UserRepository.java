package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByPersonalMail(String personalMail);
    Optional<User> findByEduMail(String eduMail);
    Optional<User> findByStudentCode(String studentCode);

    boolean existsByPersonalMail(String personalMail);
    boolean existsByEduMail(String eduMail);
    boolean existsByStudentCode(String studentCode);

    // Case-insensitive helpers
    Optional<User> findByPersonalMailIgnoreCase(String personalMail);
    Optional<User> findByEduMailIgnoreCase(String eduMail);
    
    // Handle duplicates by returning List (use first element)
    java.util.List<User> findAllByPersonalMailIgnoreCase(String personalMail);
    java.util.List<User> findAllByEduMailIgnoreCase(String eduMail);
}


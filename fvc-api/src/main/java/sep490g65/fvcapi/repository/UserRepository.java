package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.User;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
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
    List<User> findAllByPersonalMailIgnoreCase(String personalMail);
    List<User> findAllByEduMailIgnoreCase(String eduMail);
    
    // Find multiple users by student codes
    List<User> findByStudentCodeIn(List<String> studentCodes);
    // Find user by either edu_mail or personal_mail
    Optional<User> findByEduMailOrPersonalMail(String eduMail, String personalMail);
}


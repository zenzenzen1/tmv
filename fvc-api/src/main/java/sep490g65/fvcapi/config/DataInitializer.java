package sep490g65.fvcapi.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.repository.UserRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create or update test admin user
        if (!userRepository.existsByStudentCode("ADMIN001")) {
            User adminUser = new User();
            adminUser.setStudentCode("ADMIN001");
            adminUser.setFullName("Administrator");
            adminUser.setPersonalMail("admin@fvc.com");
            adminUser.setEduMail("admin@fpt.edu.vn");
            adminUser.setHashPassword(passwordEncoder.encode("admin123"));
            adminUser.setSystemRole(SystemRole.ADMIN);
            adminUser.setStatus(true);
            adminUser.setGender("MALE");
            adminUser.setDob(java.time.LocalDate.of(1995, 5, 15));
            
            userRepository.save(adminUser);
            log.info("Created test admin user: ADMIN001 / admin123");
        } else {
            // Update existing admin user if missing gender/dob
            userRepository.findByStudentCode("ADMIN001").ifPresent(adminUser -> {
                if (adminUser.getGender() == null || adminUser.getDob() == null) {
                    adminUser.setGender("MALE");
                    adminUser.setDob(java.time.LocalDate.of(1995, 5, 15));
                    userRepository.save(adminUser);
                    log.info("Updated test admin user with gender/dob");
                }
            });
        }

        // Create or update test regular user
        if (!userRepository.existsByStudentCode("USER001")) {
            User regularUser = new User();
            regularUser.setStudentCode("USER001");
            regularUser.setFullName("Regular User");
            regularUser.setPersonalMail("user@fvc.com");
            regularUser.setEduMail("user@fpt.edu.vn");
            regularUser.setHashPassword(passwordEncoder.encode("user123"));
            regularUser.setSystemRole(SystemRole.MEMBER);
            regularUser.setStatus(true);
            regularUser.setGender("FEMALE");
            regularUser.setDob(java.time.LocalDate.of(2000, 8, 20));
            
            userRepository.save(regularUser);
            log.info("Created test regular user: USER001 / user123");
        } else {
            // Update existing regular user if missing gender/dob
            userRepository.findByStudentCode("USER001").ifPresent(regularUser -> {
                if (regularUser.getGender() == null || regularUser.getDob() == null) {
                    regularUser.setGender("FEMALE");
                    regularUser.setDob(java.time.LocalDate.of(2000, 8, 20));
                    userRepository.save(regularUser);
                    log.info("Updated test regular user with gender/dob");
                }
            });
        }
    }
}

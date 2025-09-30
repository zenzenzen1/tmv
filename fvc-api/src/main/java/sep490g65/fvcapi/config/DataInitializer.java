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
        // Create test admin user if not exists
        if (!userRepository.existsByStudentCode("ADMIN001")) {
            User adminUser = new User();
            adminUser.setStudentCode("ADMIN001");
            adminUser.setFullName("Administrator");
            adminUser.setPersonalMail("admin@fvc.com");
            adminUser.setEduMail("admin@fpt.edu.vn");
            adminUser.setHashPassword(passwordEncoder.encode("admin123"));
            adminUser.setSystemRole(SystemRole.ADMIN);
            adminUser.setStatus(true);
            
            userRepository.save(adminUser);
            log.info("Created test admin user: ADMIN001 / admin123");
        }

        // Create test regular user if not exists
        if (!userRepository.existsByStudentCode("USER001")) {
            User regularUser = new User();
            regularUser.setStudentCode("USER001");
            regularUser.setFullName("Regular User");
            regularUser.setPersonalMail("user@fvc.com");
            regularUser.setEduMail("user@fpt.edu.vn");
            regularUser.setHashPassword(passwordEncoder.encode("user123"));
            regularUser.setSystemRole(SystemRole.MEMBER);
            regularUser.setStatus(true);
            
            userRepository.save(regularUser);
            log.info("Created test regular user: USER001 / user123");
        }
    }
}

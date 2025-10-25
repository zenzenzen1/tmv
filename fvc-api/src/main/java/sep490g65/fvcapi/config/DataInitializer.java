package sep490g65.fvcapi.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.entity.VovinamFistConfig;
import sep490g65.fvcapi.entity.VovinamFistItem;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.repository.VovinamFistConfigRepository;
import sep490g65.fvcapi.repository.VovinamFistItemRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VovinamFistConfigRepository fistConfigRepository;
    private final VovinamFistItemRepository fistItemRepository;

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

        // Create fist configs and items if not exist
        if (fistConfigRepository.count() == 0) {
            // Create Đa luyện config
            VovinamFistConfig daLuyenConfig = VovinamFistConfig.builder()
                    .name("Đa luyện")
                    .description("Thi đấu đa luyện")
                    .status(true)
                    .build();
            daLuyenConfig = fistConfigRepository.save(daLuyenConfig);

            // Create Đơn luyện config
            VovinamFistConfig donLuyenConfig = VovinamFistConfig.builder()
                    .name("Đơn luyện")
                    .description("Thi đấu đơn luyện")
                    .status(true)
                    .build();
            donLuyenConfig = fistConfigRepository.save(donLuyenConfig);

            // Create items for Đa luyện
            VovinamFistItem daLuyen1 = VovinamFistItem.builder()
                    .name("Đa luyện 1")
                    .description("Đa luyện cấp 1")
                    .level(1)
                    .vovinamFistConfig(daLuyenConfig)
                    .build();
            fistItemRepository.save(daLuyen1);

            VovinamFistItem daLuyen2 = VovinamFistItem.builder()
                    .name("Đa luyện 2")
                    .description("Đa luyện cấp 2")
                    .level(2)
                    .vovinamFistConfig(daLuyenConfig)
                    .build();
            fistItemRepository.save(daLuyen2);

            // Create items for Đơn luyện
            VovinamFistItem donLuyen1 = VovinamFistItem.builder()
                    .name("Đơn luyện 1")
                    .description("Đơn luyện cấp 1")
                    .level(1)
                    .vovinamFistConfig(donLuyenConfig)
                    .build();
            fistItemRepository.save(donLuyen1);

            VovinamFistItem donLuyen2 = VovinamFistItem.builder()
                    .name("Đơn luyện 2")
                    .description("Đơn luyện cấp 2")
                    .level(2)
                    .vovinamFistConfig(donLuyenConfig)
                    .build();
            fistItemRepository.save(donLuyen2);

            log.info("Created fist configs and items");
        }
    }
}

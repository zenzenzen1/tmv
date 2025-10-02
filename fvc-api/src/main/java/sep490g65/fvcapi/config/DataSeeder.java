package sep490g65.fvcapi.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.entity.SubmittedApplicationForm;
import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.repository.SubmittedApplicationFormRepository;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.enums.FormStatus;

import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final CompetitionRepository competitionRepository;
    private final ApplicationFormConfigRepository formRepository;
    private final SubmittedApplicationFormRepository submittedRepository;
    private final UserRepository userRepository;

    @PostConstruct
    @Transactional
    public void seed() {
        boolean needCompetitions = competitionRepository.count() == 0;

        // PUBLISHED: registration window overlaps today
        Competition c1 = new Competition();
        c1.setName("FVCUP 2025 — Spring");
        c1.setStartDate(LocalDate.now().plusDays(30));
        c1.setEndDate(LocalDate.now().plusDays(33));
        c1.setRegistrationStartDate(LocalDate.now().minusDays(1));
        c1.setRegistrationEndDate(LocalDate.now().plusDays(10));
        c1.setNumberOfParticipants(248);
        c1.setStatus(FormStatus.PUBLISH);

        // CLOSED: registration window ended before today
        Competition c2 = new Competition();
        c2.setName("FVCUP 2025 — Summer");
        c2.setStartDate(LocalDate.now().minusDays(40));
        c2.setEndDate(LocalDate.now().minusDays(37));
        c2.setRegistrationStartDate(LocalDate.now().minusDays(20));
        c2.setRegistrationEndDate(LocalDate.now().minusDays(1));
        c2.setNumberOfParticipants(86);
        c2.setStatus(FormStatus.ARCHIVED);

        // DRAFT: registration window starts in the future
        Competition c3 = new Competition();
        c3.setName("CLB Vovinam FPTU — Tuyển thành viên");
        c3.setStartDate(LocalDate.now().plusDays(15));
        c3.setEndDate(LocalDate.now().plusDays(16));
        c3.setRegistrationStartDate(LocalDate.now().plusDays(5));
        c3.setRegistrationEndDate(LocalDate.now().plusDays(10));
        c3.setNumberOfParticipants(0);
        c3.setStatus(FormStatus.DRAFT);

        if (needCompetitions) {
            competitionRepository.saveAll(List.of(c1, c2, c3));
        }
        // Ensure managed references for competitions
        List<Competition> comps = competitionRepository.findAll();
        Competition mc1 = comps.size() > 0 ? comps.get(0) : competitionRepository.save(c1);
        Competition mc2 = comps.size() > 1 ? comps.get(1) : competitionRepository.save(c2);
        Competition mc3 = comps.size() > 2 ? comps.get(2) : competitionRepository.save(c3);

        ApplicationFormConfig f1 = ApplicationFormConfig.builder()
                .name("Đăng Ký Giải Vovinam 2025")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .description("Form đăng ký tham gia giải đấu")
                .competition(mc1)
                .status(FormStatus.PUBLISH)
                .build();

        ApplicationFormConfig f2 = ApplicationFormConfig.builder()
                .name("Đăng ký thử nghiệm — Khóa kín")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .description("Form thử nghiệm")
                .competition(mc2)
                .status(FormStatus.ARCHIVED)
                .build();

        ApplicationFormConfig f3 = ApplicationFormConfig.builder()
                .name("Đăng ký CLB 2025")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .description("Đăng ký câu lạc bộ")
                .competition(mc3)
                .status(FormStatus.DRAFT)
                .build();

        ApplicationFormConfig mf1;
        if (formRepository.count() == 0) {
            formRepository.saveAll(List.of(f1, f2, f3));
            mf1 = formRepository.findAll().stream().findFirst().orElse(f1);
        } else {
            List<ApplicationFormConfig> forms = formRepository.findAll();
            mf1 = forms.stream().findFirst().orElseGet(() -> formRepository.save(f1));
        }

        // Seed a simple user for submissions
        User u = new User();
        u.setFullName("Nguyễn Văn A");
        u.setPersonalMail("a.nguyen@example.com");
        u.setEduMail("a.nguyen@fpt.edu.vn");
        u.setHashPassword("noop");
        u.setSystemRole(SystemRole.MEMBER);
        u.setStatus(true);
        if (userRepository.count() == 0) {
            u = userRepository.save(u);
        } else {
            u = userRepository.findAll().get(0);
        }

        // Seed 3 submissions for f1
        String data1 = "{" +
                "\"fullName\":\"Nguyễn Văn A\"," +
                "\"email\":\"a.nguyen@fpt.edu.vn\"," +
                "\"gender\":\"MALE\"" +
                "}";
        SubmittedApplicationForm s1 = SubmittedApplicationForm.builder()
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .formData(data1)
                .user(u)
                .status(ApplicationFormStatus.APPROVED)
                .applicationFormConfig(mf1)
                .build();
        String data2 = "{" +
                "\"fullName\":\"Trần Thị B\"," +
                "\"email\":\"b.tran@fpt.edu.vn\"," +
                "\"gender\":\"FEMALE\"" +
                "}";
        SubmittedApplicationForm s2 = SubmittedApplicationForm.builder()
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .formData(data2)
                .user(u)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(mf1)
                .build();
        String data3 = "{" +
                "\"fullName\":\"Phạm C\"," +
                "\"email\":\"c.pham@fpt.edu.vn\"," +
                "\"gender\":\"MALE\"" +
                "}";
        SubmittedApplicationForm s3 = SubmittedApplicationForm.builder()
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .formData(data3)
                .user(u)
                .status(ApplicationFormStatus.REJECTED)
                .applicationFormConfig(mf1)
                .build();
        if (submittedRepository.count() == 0) {
            submittedRepository.saveAll(List.of(s1, s2, s3));
        }

        log.info("Seeded competitions, form configs, and submissions");
    }
}



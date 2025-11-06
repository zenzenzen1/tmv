package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.SystemRole;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;


    @Column()
    private String fullName;

    @Column()
    private String personalMail;

    @Column()
    private String eduMail;

    @Column()
    private String hashPassword;

    @Column()
    private String studentCode;

    @Column()
    private Boolean status;

    @Column()
    private LocalDate dob;

    @Column(length = 10)
    private String gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SystemRole systemRole;

    @Column()
    private Boolean isInChallenge;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CompetitionRole> competitionRoles;

    @OneToMany(mappedBy = "assignedBy", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CompetitionRole> assignedCompetitionRoles;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubmittedApplicationForm> submittedApplicationForms;

}

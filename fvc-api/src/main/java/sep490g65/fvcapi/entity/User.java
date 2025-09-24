package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.SystemRole;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private LocalDateTime createdAt = LocalDateTime.now();


}

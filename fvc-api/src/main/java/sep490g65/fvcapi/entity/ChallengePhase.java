package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.PhaseStatus;

import java.time.LocalDate;

@Entity
@Table(
        name = "challenge_phases",
        uniqueConstraints = @UniqueConstraint(name = "uk_phase_cycle_name", columnNames = {"cycle_id", "name"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ChallengePhase extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @Column(nullable = false, length = 150)
    private String name;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PhaseStatus status;
}



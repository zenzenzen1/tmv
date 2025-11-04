package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.EvaluationScheduleStatus;

@Entity
@Table(name = "evaluation_schedules")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EvaluationSchedule extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @ManyToOne
    @JoinColumn(name = "phase_id")
    private ChallengePhase phase;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EvaluationScheduleStatus status;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;
}



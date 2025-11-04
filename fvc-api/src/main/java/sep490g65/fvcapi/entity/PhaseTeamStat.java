package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "phase_team_stats",
        uniqueConstraints = @UniqueConstraint(name = "uk_phase_team_unique", columnNames = {"phase_id", "team_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PhaseTeamStat extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "phase_id", nullable = false)
    private ChallengePhase phase;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private Integer currentMembers = 0;

    @Column(nullable = false)
    private Integer eliminatedMembers = 0;

    private Integer trainSessionsRequired;

    private Integer eventsRequired;

    private Integer fitnessEvalsRequired;
}



package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import sep490g65.fvcapi.enums.TrainingSessionStatus;

@Entity
@Table(name = "training_sessions",
        indexes = {
                @Index(name = "idx_training_cycle_team_start", columnList = "cycle_id, team_id, start_time")
        })
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class TrainingSession extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team; // nullable: all-team session

    @ManyToOne
    @JoinColumn(name = "phase_id")
    private ChallengePhase phase;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TrainingSessionStatus status = TrainingSessionStatus.PLANNED;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "updated_by")
    private User updatedBy;
}



package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.EvaluationSessionType;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_sessions")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EvaluationSession extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "schedule_id", nullable = false)
    private EvaluationSchedule schedule;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EvaluationSessionType type;
}



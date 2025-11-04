package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.EvaluationResultStatus;

@Entity
@Table(name = "trainee_evaluation_results",
        uniqueConstraints = @UniqueConstraint(name = "uk_session_user_result_unique", columnNames = {"session_id", "user_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class TraineeEvaluationResult extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private EvaluationSession session;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(precision = 5, scale = 2)
    private Double overallScore;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EvaluationResultStatus status;

    @Column(columnDefinition = "text")
    private String comment;
}



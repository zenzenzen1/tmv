package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "evaluator_assignments",
        uniqueConstraints = @UniqueConstraint(name = "uk_session_assessor_unique", columnNames = {"session_id", "assessor_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EvaluatorAssignment extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private EvaluationSession session;

    @ManyToOne(optional = false)
    @JoinColumn(name = "assessor_id", nullable = false)
    private User assessor;
}



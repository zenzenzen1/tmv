package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "evaluation_scores",
        uniqueConstraints = @UniqueConstraint(name = "uk_result_criteria_unique", columnNames = {"result_id", "criteria_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EvaluationScore extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "result_id", nullable = false)
    private TraineeEvaluationResult result;

    @ManyToOne(optional = false)
    @JoinColumn(name = "criteria_id", nullable = false)
    private EvaluationCriteria criteria;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal score;
}



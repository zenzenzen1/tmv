package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "evaluation_criteria")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EvaluationCriteria extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal weight; // should sum to 100 per session template; enforced by service
}



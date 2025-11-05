package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private Double weight; // should sum to 100 per session template; enforced by service
}



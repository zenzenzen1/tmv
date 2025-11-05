package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "department_capacity",
        uniqueConstraints = @UniqueConstraint(name = "uk_capacity_cycle_department", columnNames = {"cycle_id", "department_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class DepartmentCapacity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @ManyToOne(optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    private Integer capacity;
}



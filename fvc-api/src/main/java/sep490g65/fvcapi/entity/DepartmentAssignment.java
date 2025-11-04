package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "department_assignments",
        uniqueConstraints = @UniqueConstraint(name = "uk_assignment_cycle_user", columnNames = {"cycle_id", "user_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class DepartmentAssignment extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Column(length = 20)
    private String status; // PENDING | INTERVIEW | APPROVED | REJECTED

    @Column(length = 255)
    private String note;
}



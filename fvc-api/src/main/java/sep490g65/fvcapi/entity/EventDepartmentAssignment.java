package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "event_department_assignments",
        uniqueConstraints = @UniqueConstraint(name = "uk_event_department_unique", columnNames = {"event_id", "department_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EventDepartmentAssignment extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;
}



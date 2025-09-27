package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.CompetitionRoleType;

@Entity
@Table(
        name = "competition_roles",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"competition_id", "user_id", "role"})
        }
)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CompetitionRole extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "competition_id")
    private Competition competition;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompetitionRoleType role;

    @ManyToOne
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    // getters/setters
}

package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "teams",
        uniqueConstraints = @UniqueConstraint(name = "uk_team_cycle_code", columnNames = {"cycle_id", "code"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Team extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(length = 100)
    private String name;
}



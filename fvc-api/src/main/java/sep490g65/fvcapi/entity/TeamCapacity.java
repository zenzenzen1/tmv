package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "team_capacity",
        uniqueConstraints = @UniqueConstraint(name = "uk_capacity_cycle_team", columnNames = {"cycle_id", "team_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class TeamCapacity extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private Integer capacity;
}



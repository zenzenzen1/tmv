package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "performance_athletes", 
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_performance_athlete", columnNames = {"performance_id", "athlete_id"}),
           @UniqueConstraint(name = "uk_performance_team_position", columnNames = {"performance_id", "team_position"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceAthlete extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_id", nullable = false)
    private Performance performance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "athlete_id", nullable = false)
    private Athlete athlete;

    @Column(name = "team_position")
    private Integer teamPosition;  // Vị trí trong đội (1, 2, 3...)

    @Column(name = "is_captain")
    private Boolean isCaptain = false;  // Đội trưởng
}

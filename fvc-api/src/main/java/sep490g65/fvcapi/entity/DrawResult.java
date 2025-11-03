package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "draw_results")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class DrawResult extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "draw_session_id", nullable = false)
    private String drawSessionId;

    @Column(name = "athlete_id", nullable = false)
    private String athleteId;

    @Column(name = "seed_number", nullable = false)
    private Integer seedNumber;

    @Column(name = "athlete_name", nullable = false)
    private String athleteName;

    @Column(name = "athlete_club")
    private String athleteClub;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "draw_session_id", insertable = false, updatable = false)
    private DrawSession drawSession;
}

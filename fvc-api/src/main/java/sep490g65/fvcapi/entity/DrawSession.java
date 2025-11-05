package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.DrawType;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "draw_sessions")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class DrawSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "competition_id", nullable = false)
    private String competitionId;

    @Column(name = "weight_class_id", nullable = false)
    private String weightClassId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DrawType drawType; // OFFLINE_MANUAL, ONLINE_AUTOMATIC

    @Column(name = "drawn_by", nullable = false)
    private String drawnBy; // User ID who performed the draw

    @Column(name = "draw_date", nullable = false)
    private LocalDateTime drawDate;

    @Column(name = "is_final", nullable = false)
    private Boolean isFinal = false;

    @Column(length = 1000)
    private String notes; // Additional notes about the draw process

    @OneToMany(mappedBy = "drawSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DrawResult> drawResults;

    // Audit fields
    @Column(name = "created_by", nullable = false)
    private String createdBy;
}

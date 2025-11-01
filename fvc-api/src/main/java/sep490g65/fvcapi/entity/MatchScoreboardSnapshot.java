package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_scoreboard_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchScoreboardSnapshot {

    @Id
    @Column(name = "match_id")
    private String matchId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @Column(name = "last_event_id")
    private String lastEventId;

    @Column(name = "red_score", nullable = false)
    @Builder.Default
    private Integer redScore = 0;

    @Column(name = "blue_score", nullable = false)
    @Builder.Default
    private Integer blueScore = 0;

    @Column(name = "red_medical_timeout_count", nullable = false)
    @Builder.Default
    private Integer redMedicalTimeoutCount = 0;

    @Column(name = "blue_medical_timeout_count", nullable = false)
    @Builder.Default
    private Integer blueMedicalTimeoutCount = 0;

    @Column(name = "red_warning_count", nullable = false)
    @Builder.Default
    private Integer redWarningCount = 0;

    @Column(name = "blue_warning_count", nullable = false)
    @Builder.Default
    private Integer blueWarningCount = 0;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private java.time.LocalDateTime updatedAt = java.time.LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}


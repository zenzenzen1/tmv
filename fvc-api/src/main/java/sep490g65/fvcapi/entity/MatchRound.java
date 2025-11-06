package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import sep490g65.fvcapi.enums.MatchStatus;
import sep490g65.fvcapi.enums.RoundType;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches_round", indexes = {
        @Index(name = "idx_matches_round_match", columnList = "match_id"),
        @Index(name = "idx_matches_round_round_number", columnList = "match_id, round_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchRound extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(name = "match_id", insertable = false, updatable = false)
    private String matchId;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "round_type", nullable = false, length = 20)
    @Builder.Default
    private RoundType roundType = RoundType.MAIN;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "red_score", nullable = false)
    @Builder.Default
    private Integer redScore = 0;

    @Column(name = "blue_score", nullable = false)
    @Builder.Default
    private Integer blueScore = 0;

    @Column(name = "duration_seconds")
    private Integer durationSeconds; // Actual duration when round ended
    
    @Column(name = "scheduled_duration_seconds")
    private Integer scheduledDurationSeconds; // Scheduled duration for this round

    @Column(name = "notes", length = 500)
    private String notes;
}


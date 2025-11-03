package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import sep490g65.fvcapi.enums.MatchEventType;
import sep490g65.fvcapi.enums.Corner;

@Entity
@Table(name = "match_events", indexes = {
        @Index(name = "idx_match_events_match", columnList = "match_id"),
        @Index(name = "idx_match_events_match_round_time", columnList = "match_id,round,timestamp_in_round_seconds"),
        @Index(name = "idx_match_events_match_created", columnList = "match_id,created_at"),
        @Index(name = "idx_match_events_match_round", columnList = "match_id,round"),
        @Index(name = "idx_match_events_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(nullable = false)
    private Integer round;

    @Column(name = "timestamp_in_round_seconds", nullable = false)
    private Integer timestampInRoundSeconds;

    @Column(name = "judge_id", length = 36)
    private String judgeId;

    /**
     * Comma-separated list of assessor IDs who voted/agreed on this event
     * Used for consensus scoring - stores all assessors who voted for the same score
     */
    @Column(name = "assessor_ids", columnDefinition = "TEXT")
    private String assessorIds;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Corner corner;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private MatchEventType eventType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}


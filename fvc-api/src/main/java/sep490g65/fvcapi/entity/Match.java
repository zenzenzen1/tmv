package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import sep490g65.fvcapi.enums.MatchStatus;
import sep490g65.fvcapi.enums.Corner;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "matches", indexes = {
        @Index(name = "idx_matches_competition", columnList = "competition_id"),
        @Index(name = "idx_matches_status", columnList = "status"),
        @Index(name = "idx_matches_weight_class", columnList = "weight_class_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "competition_id", nullable = false)
    private String competitionId;

    @Column(name = "weight_class_id")
    private String weightClassId;

    @Column(name = "field_id")
    private String fieldId;

    @Column(name = "round_type", nullable = false, length = 50)
    private String roundType;

    @Column(name = "red_athlete_id", nullable = false)
    private String redAthleteId;

    @Column(name = "blue_athlete_id", nullable = false)
    private String blueAthleteId;

    @Column(name = "red_athlete_name", nullable = false, length = 200)
    private String redAthleteName;

    @Column(name = "blue_athlete_name", nullable = false, length = 200)
    private String blueAthleteName;

    @Column(name = "red_athlete_unit", length = 200)
    private String redAthleteUnit;

    @Column(name = "blue_athlete_unit", length = 200)
    private String blueAthleteUnit;

    @Column(name = "red_athlete_sbt_number", length = 50)
    private String redAthleteSbtNumber;

    @Column(name = "blue_athlete_sbt_number", length = 50)
    private String blueAthleteSbtNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    @Column(name = "current_round", nullable = false)
    @Builder.Default
    private Integer currentRound = 1;

    @Column(name = "total_rounds", nullable = false)
    @Builder.Default
    private Integer totalRounds = 3;

    @Column(name = "round_duration_seconds", nullable = false)
    @Builder.Default
    private Integer roundDurationSeconds = 120;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "winner_corner", length = 10)
    private Corner winnerCorner;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MatchEvent> events = new ArrayList<>();

    @OneToOne(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private MatchScoreboardSnapshot scoreboardSnapshot;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MatchAssessor> assessors = new ArrayList<>();
}


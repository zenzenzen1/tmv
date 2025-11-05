package sep490g65.fvcapi.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "athletes", indexes = {
        @Index(name = "idx_athlete_tournament_email", columnList = "tournament_id,email", unique = true),
        @Index(name = "idx_athlete_competition_type", columnList = "competition_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Athlete extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tournament_id", nullable = false)
    private String tournamentId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = true)
    private String email;

    @Column(name = "student_id")
    private String studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column
    private String club; // can be null

    @Enumerated(EnumType.STRING)
    @Column(name = "competition_type", nullable = false)
    private CompetitionType competitionType;

    // Hierarchical competition structure (logical labels only)
    @Column(name = "sub_competition_type")
    private String subCompetitionType; // e.g. "Song luyện", "Đa luyện", "Hạng cân"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AthleteStatus status; // NOT_STARTED / IN_PROGRESS / DONE / VIOLATED

    @Column(name = "competition_order")
    private Integer competitionOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_order_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private CompetitionOrder competitionOrderObject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Competition competition;


    public enum Gender { MALE, FEMALE }

    public enum CompetitionType { fighting, quyen, music }

    public enum AthleteStatus { NOT_STARTED, IN_PROGRESS, DONE, VIOLATED }

    // Tight linking IDs (optional FKs)
    @Column(name = "weight_class_id")
    private String weightClassId;

    @Column(name = "fist_config_id")
    private String fistConfigId;

    @Column(name = "fist_item_id")
    private String fistItemId;

    @Column(name = "music_content_id")
    private String musicContentId;
}



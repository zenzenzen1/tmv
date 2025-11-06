package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "athletes", indexes = {
        @Index(name = "idx_athlete_competition_email", columnList = "competition_id,email", unique = true),
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

    @Column(name = "competition_id", nullable = false)
    private String competitionId;

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

    // Draw seed number assigned by drawing process (nullable until drawn)
    @Column(name = "draw_seed_number")
    private Integer drawSeedNumber;


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



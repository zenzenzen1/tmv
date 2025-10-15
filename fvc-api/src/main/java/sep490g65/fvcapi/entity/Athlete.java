package sep490g65.fvcapi.entity;

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

    @Column(nullable = false)
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

    // Hierarchical competition structure
    @Column(name = "sub_competition_type")
    private String subCompetitionType; // e.g. "Song luyện", "Đa luyện", "Hạng cân"

    @Column(name = "detail_sub_competition_type")
    private String detailSubCompetitionType; // e.g. "Song luyện 1", "Võ nhạc 1", "Đa luyện 2"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AthleteStatus status; // NOT_STARTED / IN_PROGRESS / DONE / VIOLATED

    public enum Gender { MALE, FEMALE }

    public enum CompetitionType { fighting, quyen, music }

    public enum AthleteStatus { NOT_STARTED, IN_PROGRESS, DONE, VIOLATED }
}



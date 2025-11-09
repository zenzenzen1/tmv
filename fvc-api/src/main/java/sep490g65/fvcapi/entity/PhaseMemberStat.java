package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.MemberPhaseStatus;

@Entity
@Table(
        name = "phase_member_stats",
        uniqueConstraints = @UniqueConstraint(name = "uk_phase_member_unique", columnNames = {"phase_id", "user_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PhaseMemberStat extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "phase_id", nullable = false)
    private ChallengePhase phase;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private Integer trainSessionsAttended = 0;

    // Số event đã tham gia
    @Column(nullable = false)
    private Integer eventsAttended = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MemberPhaseStatus status = MemberPhaseStatus.ON_TRACK;
}


package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import sep490g65.fvcapi.enums.AssessorRole;

@Entity
@Table(name = "match_assessors", uniqueConstraints = {
    @UniqueConstraint(name = "uk_match_assessor_position", columnNames = {"match_id", "position"}),
    @UniqueConstraint(name = "uk_match_user", columnNames = {"match_id", "user_id"})
}, indexes = {
    @Index(name = "idx_match_assessors_match", columnList = "match_id"),
    @Index(name = "idx_match_assessors_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchAssessor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Position of assessor in the match (1-6)
     * Positions 1-5: ASSESSOR (Giám định)
     * Position 6: JUDGER (Trọng tài)
     */
    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private AssessorRole role;

    /**
     * Optional: Notes or remarks for this assessor
     */
    @Column(name = "notes", length = 500)
    private String notes;
}


package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import sep490g65.fvcapi.enums.AssessorRole;

@Entity
@Table(name = "match_assessors", uniqueConstraints = {
    @UniqueConstraint(name = "uk_match_assessor_position", columnNames = {"match_id", "position"}),
    @UniqueConstraint(name = "uk_match_user", columnNames = {"match_id", "user_id"}),
    @UniqueConstraint(name = "uk_match_assessor_performance", columnNames = {"user_id", "performance_id"}),
    @UniqueConstraint(name = "uk_match_assessor_performance_match", columnNames = {"performance_match_id", "user_id"}),
    @UniqueConstraint(name = "uk_match_assessor_match_user_role", columnNames = {"match_id", "user_id", "role"})
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
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Cho đối kháng: link với Match entity (nullable khi là quyền/võ nhạc)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    // Cho quyền/võ nhạc: link với PerformanceMatch (để quản lý match setup)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_match_id")
    private PerformanceMatch performanceMatch;

    // Cho quyền và võ nhạc (nullable khi là đối kháng): link với Performance (để scoring)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_id")
    private Performance performance;

    // Cho đối kháng: role (JUDGER hoặc ASSESSOR), nullable cho quyền/võ nhạc
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private AssessorRole role;

    // Cho đối kháng: vị trí của assessor trong match, nullable cho quyền/võ nhạc
    /**
     * Position of assessor in the match (1-6)
     * Positions 1-5: ASSESSOR (Giám định)
     * Position 6: JUDGER (Trọng tài)
     */
    @Column
    private Integer position;

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;
}


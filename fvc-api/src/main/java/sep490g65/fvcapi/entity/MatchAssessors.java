package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "match_assessors",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_match_assessor_performance", columnNames = {"user_id", "performance_id"}),
           @UniqueConstraint(name = "uk_match_assessor_performance_match", columnNames = {"performance_match_id", "user_id"}),
           @UniqueConstraint(name = "uk_match_assessor_match_user_role", columnNames = {"match_id", "user_id", "role"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchAssessors extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Cho quyền/võ nhạc: link với PerformanceMatch (để quản lý match setup)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_match_id")
    private PerformanceMatch performanceMatch;

    // Cho quyền và võ nhạc (nullable khi là đối kháng): link với Performance (để scoring)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_id")
    private Performance performance;

    // Cho đối kháng (nullable khi là quyền/võ nhạc)
    @Column(name = "match_id", length = 255)
    private String matchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Specialization specialization;

    // Cho đối kháng: role (JUDGER hoặc ASSESSOR), nullable cho quyền/võ nhạc
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MatchRole role;

    // Cho đối kháng: vị trí của assessor trong match, nullable cho quyền/võ nhạc
    @Column
    private Integer position;

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    public enum Specialization {
        QUYEN,    // Quyền
        MUSIC,    // Võ nhạc
        FIGHTING  // Đối kháng
    }

    public enum MatchRole {
        JUDGER,     // Trọng tài
        ASSESSOR    // Giám khảo
    }
}

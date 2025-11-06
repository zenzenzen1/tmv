package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "performances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Performance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    // Team information (chỉ có khi is_team = true)
    @Column(name = "is_team", nullable = false)
    private Boolean isTeam = false;

    @Column(name = "team_id")
    private String teamId;

    @Column(name = "team_name")
    private String teamName;

    // Số người/tiết mục (nếu có cấu hình, có thể null)
    @Column(name = "participants_per_entry")
    private Integer participantsPerEntry;

    // Performance details
    @Enumerated(EnumType.STRING)
    @Column(name = "performance_type", nullable = false, length = 20)
    private PerformanceType performanceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    @Column(name = "content_id")
    private String contentId;

    // Denormalized content identifiers for FE consumption
    @Column(name = "fist_config_id")
    private String fistConfigId; // Quyền: category/config ID

    @Column(name = "fist_item_id")
    private String fistItemId;   // Quyền: item/content ID

    @Column(name = "music_content_id")
    private String musicContentId; // Võ nhạc: content ID

    // Status and timing
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PerformanceStatus status;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "total_score", precision = 5, scale = 2)
    private BigDecimal totalScore;

    // Relationships
    @OneToMany(mappedBy = "performance", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PerformanceAthlete> athletes = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "performance", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AssessorScore> assessorScores = new java.util.ArrayList<>();

    public enum PerformanceType {
        INDIVIDUAL,  // Cá nhân
        TEAM         // Đồng đội
    }

    public enum ContentType {
        QUYEN,    // Quyền
        MUSIC,    // Võ nhạc
        FIGHTING  // Đối kháng
    }

    public enum PerformanceStatus {
        PENDING,      // Chờ thi
        IN_PROGRESS,  // Đang thi
        COMPLETED,    // Hoàn thành
        CANCELLED     // Hủy bỏ
    }
}

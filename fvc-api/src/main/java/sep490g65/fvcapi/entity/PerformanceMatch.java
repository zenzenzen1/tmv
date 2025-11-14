package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "performance_matches",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_performance_match_performance", columnNames = {"performance_id"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceMatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    // Link với Performance (1-1 relationship)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_id", nullable = false, unique = true)
    private Performance performance;

    @Column(name = "match_order")
    private Integer matchOrder; // Thứ tự trình diễn trong giải

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime; // Thời gian dự kiến

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime; // Thời gian bắt đầu thực tế

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime; // Thời gian kết thúc thực tế

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private Performance.ContentType contentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchStatus status;

    @Column(length = 500)
    private String notes;

    // Denormalized filter fields for FE filtering
    @Column(name = "fist_config_id")
    private String fistConfigId; // Quyền: category/config ID

    @Column(name = "fist_item_id")
    private String fistItemId;   // Quyền: item/content ID

    @Column(name = "music_content_id")
    private String musicContentId; // Võ nhạc: content ID

    @Column(name = "duration_seconds")
    private Integer durationSeconds; // Planned timer seconds

    @Column(name = "field_id")
    private String fieldId;

    @Column(name = "field_location")
    private String fieldLocation;

    @Column(name = "scheduled_start_time")
    private LocalDateTime scheduledStartTime; // Giờ bắt đầu dự kiến

    @Column(name = "athletes_present", columnDefinition = "TEXT")
    private String athletesPresent; // JSON map: {"athleteId1": true, "athleteId2": false, ...}

    // Relationships
    @OneToMany(mappedBy = "performanceMatch", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<MatchAssessor> assessors = new java.util.ArrayList<>();

    public enum MatchStatus {
        PENDING,      // Chờ thiết lập
        READY,        // Đã thiết lập xong (có athletes và assessors)
        IN_PROGRESS,  // Đang thi
        COMPLETED,    // Hoàn thành
        CANCELLED     // Hủy bỏ
    }
}


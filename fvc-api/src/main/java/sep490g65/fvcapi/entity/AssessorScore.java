package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import com.vladmihalcea.hibernate.type.json.JsonType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessor_scores",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_match_assessor_unique", columnNames = {"performance_match_id", "assessor_id"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessorScore extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_id", nullable = false)
    private Performance performance;

    // Link trực tiếp tới trận biểu diễn để tách điểm theo từng trận (Quyền/Võ nhạc)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_match_id")
    private PerformanceMatch performanceMatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessor_id", nullable = false)
    private Assessor assessor;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score;  // Điểm từ 0.0 đến 10.0

    @Type(JsonType.class)
    @Column(name = "criteria_scores", columnDefinition = "jsonb")
    private String criteriaScores;  // Chi tiết điểm từng tiêu chí

    @Column(columnDefinition = "TEXT")
    private String notes;  // Ghi chú của giám khảo

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;
}

package sep490g65.fvcapi.entity;

import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "competition_orders",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"competition_id", "content_selection_id", "order_index"})
        },
        indexes = {
                @Index(name = "idx_competition_orders_competition", columnList = "competition_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    // Removed back-reference to athletes (competitionOrderObject) since it no longer exists on Athlete

    // Optional: scope order by a specific selected content (e.g., fist item)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_selection_id")
    private CompetitionFistItemSelection contentSelection;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}



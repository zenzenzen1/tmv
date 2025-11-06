package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.ArrangeItemType;

@Entity
@Table(name = "arrange_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_arrange_item_section_ref", 
                        columnNames = {"section_id", "ref_id"})
        },
        indexes = {
                @Index(name = "idx_arrange_item_section_order", columnList = "section_id,order_index")
        }
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ArrangeItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private ArrangeSection section;

    @Column(name = "ref_id", nullable = false)
    private String refId; // FK to athlete.id or team.id (UUID or String)

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", nullable = false, length = 20)
    private ArrangeItemType refType;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}


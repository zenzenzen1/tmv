package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.ContentType;

@Entity
@Table(name = "arrange_sections",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_arrange_section_competition_content", 
                        columnNames = {"competition_id", "content_id", "content_type"})
        },
        indexes = {
                @Index(name = "idx_arrange_section_competition", columnList = "competition_id,content_type")
        }
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ArrangeSection extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    @Column(name = "content_id", nullable = false)
    private String contentId; // FK to fist_item.id or music_content.id

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ArrangeItem> items;
}


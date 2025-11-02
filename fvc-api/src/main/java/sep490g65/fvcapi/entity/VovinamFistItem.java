package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "vovinam_fist_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VovinamFistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vovinam_fist_config_id", nullable = false)
    private VovinamFistConfig vovinamFistConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private VovinamFistItem parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VovinamFistItem> children;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer level;

    // Number of performers required per entry (e.g., Don luyen=1, Song luyen=2)
    @Column(name = "participants_per_entry")
    private Integer participantsPerEntry;

}


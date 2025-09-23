package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "vovinam_form_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VovinamFormItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vovinam_form_config_id", nullable = false)
    private VovinamFormConfig vovinamFormConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private VovinamFormItem parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VovinamFormItem> children;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer level;

}


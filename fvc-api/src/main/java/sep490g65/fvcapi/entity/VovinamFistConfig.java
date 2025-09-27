package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "vovinam_fist_configs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VovinamFistConfig extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column()
    private Boolean status;

    @OneToMany(mappedBy = "vovinamFistConfig", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<VovinamFistItem> items;

    @OneToMany(mappedBy = "vovinamFistConfig", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CompetitionVovinamFist> competitionRelations;

}

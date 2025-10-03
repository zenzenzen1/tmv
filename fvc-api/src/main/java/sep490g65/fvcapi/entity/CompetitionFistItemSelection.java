package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "competition_fist_item_selections",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"competition_id", "vovinam_fist_config_id", "vovinam_fist_item_id"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionFistItemSelection extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vovinam_fist_config_id", nullable = false)
    private VovinamFistConfig vovinamFistConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vovinam_fist_item_id", nullable = false)
    private VovinamFistItem vovinamFistItem;
}

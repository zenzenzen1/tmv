package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "vovinam_sparring_config_weight_classes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_sparring_weightclass_unique",
                        columnNames = {"vovinam_sparring_config_id", "weight_class_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VovinamSparringConfigWeightClass extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vovinam_sparring_config_id", nullable = false)
    private VovinamSparringConfig vovinamSparringConfig;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "weight_class_id", nullable = false)
    private WeightClass weightClass;
}



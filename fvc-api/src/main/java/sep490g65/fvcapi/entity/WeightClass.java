package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "weight_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeightClass extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vovinam_sparring_config_id", nullable = false)
    private VovinamSparringConfig vovinamSparringConfig;

    @Column(nullable = false, length = 10)
    private String gender;

    @Column(nullable = false, length = 50)
    private String weightClass; // Ex: -55kg, 55-60kg, +75kg

    @Column(precision = 5, scale = 2)
    private BigDecimal minWeight; // kg

    @Column(precision = 5, scale = 2)
    private BigDecimal maxWeight; // kg
}

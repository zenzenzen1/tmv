package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import sep490g65.fvcapi.enums.Gender;
import sep490g65.fvcapi.enums.WeightClassStatus;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    @Column(nullable = false, length = 50)
    private String weightClass; // Ex: -55kg, 55-60kg, +75kg

    @Column(precision = 5, scale = 2)
    private BigDecimal minWeight; // kg

    @Column(precision = 5, scale = 2)
    private BigDecimal maxWeight; // kg

    @Column(length = 255)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private WeightClassStatus status = WeightClassStatus.DRAFT;

    @OneToMany(mappedBy = "weightClass", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VovinamSparringConfigWeightClass> sparringConfigLinks = new ArrayList<>();

    @PrePersist
    @PreUpdate
    protected void generateWeightClassLabel() {
        if (minWeight != null && maxWeight != null) {
            this.weightClass = formatWeight(minWeight) + "-" + formatWeight(maxWeight) + "kg";
        }
    }

    private String formatWeight(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }
}

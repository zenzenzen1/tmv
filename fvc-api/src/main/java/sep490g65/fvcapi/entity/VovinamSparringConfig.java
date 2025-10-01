package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vovinam_sparring_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VovinamSparringConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    @Column(nullable = false)
    private Integer numberOfRounds = 2;

    @Column(nullable = false)
    private Integer roundDurationSeconds = 90;

    @Column(nullable = false)
    private Boolean allowExtraRound = true;

    @Column(nullable = false)
    private Integer maxExtraRounds = 1;

    @Column(nullable = false, length = 50)
    private String tieBreakRule = "WEIGHT"; // WEIGHT | DRAW | RANDOM

    @Column(nullable = false)
    private Integer assessorCount = 5;

    @Column(nullable = false)
    private Integer injuryTimeoutSeconds = 60;

    @OneToMany(mappedBy = "vovinamSparringConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VovinamSparringConfigWeightClass> weightClassLinks = new ArrayList<>();
}


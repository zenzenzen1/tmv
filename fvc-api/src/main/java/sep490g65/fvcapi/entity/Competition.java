package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.TournamentStatus;
import sep490g65.fvcapi.enums.FormStatus;
import sep490g65.fvcapi.converter.FormStatusConverter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "competitions")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Competition extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column()
    private LocalDate startDate;

    @Column()
    private LocalDate endDate;

    @Column()
    private LocalDate registrationStartDate;

    @Column()
    private LocalDate registrationEndDate;

    @Column()
    private Integer numberOfParticipants;

    @Column()
    private LocalDate drawDate;

    @Column()
    private LocalDate weighInDate;

    @Column(length = 1000)
    private String description;

    @Column(length = 200)
    private String location;

    @Column()
    private LocalTime openingCeremonyTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TournamentStatus status = TournamentStatus.DRAFT;

    @Convert(converter = FormStatusConverter.class)
    @Column(length = 20)
    private FormStatus formStatus;

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VovinamSparringConfig> sparringConfigs;

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CompetitionMusicIntegratedPerformance> musicPerformanceRelations;

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CompetitionFistItemSelection> fistItemSelections;
}
package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
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

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VovinamFormConfig> formConfigs;

    @OneToMany(mappedBy = "competition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VovinamSparringConfig> sparringConfigs;
}

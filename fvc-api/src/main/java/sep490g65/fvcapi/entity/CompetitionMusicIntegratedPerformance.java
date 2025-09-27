package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "competition_music_integrated_performance", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"competition_id", "music_integrated_performance_id"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionMusicIntegratedPerformance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "music_integrated_performance_id", nullable = false)
    private MusicIntegratedPerformance musicIntegratedPerformance;
}
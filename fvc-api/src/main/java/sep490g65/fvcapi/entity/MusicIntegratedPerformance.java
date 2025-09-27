package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "music_integrated_performances")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicIntegratedPerformance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "music_file_path")
    private String musicFilePath;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "difficulty_level")
    private String difficultyLevel;

    @Column(name = "performance_type")
    private String performanceType;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Many-to-many relationship with Competition through junction table
    @OneToMany(mappedBy = "musicIntegratedPerformance", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CompetitionMusicIntegratedPerformance> competitionRelations;
}
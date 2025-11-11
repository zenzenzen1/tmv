package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.ChallengeCycleStatus;

import java.time.LocalDate;

@Entity
@Table(name = "challenge_cycles")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ChallengeCycle extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(name = "cycle_duration_months")
    private Integer cycleDurationMonths; // Số tháng của cycle

    @Column(name = "phase_duration_weeks")
    private Integer phaseDurationWeeks; // Số tuần của mỗi phase

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChallengeCycleStatus status;

    // Tiêu chí đánh giá mặc định cho cycle (sẽ được dùng cho các phase)
    @Column(name = "train_sessions_required")
    private Integer trainSessionsRequired; // Số buổi tập bắt buộc mỗi phase

    @Column(name = "events_required")
    private Integer eventsRequired; // Số event tham gia bắt buộc mỗi phase

}



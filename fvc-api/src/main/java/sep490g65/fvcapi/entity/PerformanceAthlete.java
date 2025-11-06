package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "performance_athletes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerformanceAthlete extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performance_id", nullable = false)
    private Performance performance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "athlete_id")
    private Athlete athlete; // null ở trạng thái PENDING, sẽ được set khi approve

    // removed team_position and is_captain as per new spec

    // Thông tin tạm thời của thành viên khi chưa sinh Athlete (PENDING)
    @Column(name = "temp_full_name")
    private String tempFullName;

    @Column(name = "temp_email")
    private String tempEmail;

    @Column(name = "temp_phone")
    private String tempPhone;

    @Column(name = "temp_student_id")
    private String tempStudentId;

    @Column(name = "temp_gender")
    private String tempGender; // MALE/FEMALE (text) để linh hoạt khi chưa map enum
}

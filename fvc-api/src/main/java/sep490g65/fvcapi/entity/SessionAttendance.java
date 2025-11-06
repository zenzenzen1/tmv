package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.AttendanceStatus;
import sep490g65.fvcapi.enums.AttendanceMethod;

import java.time.LocalDateTime;

@Entity
@Table(name = "session_attendance",
        uniqueConstraints = @UniqueConstraint(name = "uk_session_user_unique", columnNames = {"session_id", "user_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class SessionAttendance extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private TrainingSession session;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status;

    @Column(name = "marked_at", nullable = false)
    private LocalDateTime markedAt = LocalDateTime.now();

    @ManyToOne(optional = false)
    @JoinColumn(name = "marked_by", nullable = false)
    private User markedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceMethod method = AttendanceMethod.MANUAL;

    @Column(length = 255)
    private String note;
}



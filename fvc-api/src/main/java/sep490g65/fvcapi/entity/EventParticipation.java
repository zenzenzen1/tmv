package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_participation",
        uniqueConstraints = @UniqueConstraint(name = "uk_event_user_unique", columnNames = {"event_id", "user_id"})
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EventParticipation extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 20)
    private String status; // REGISTERED | ATTENDED | ABSENT | WAITLISTED

    private LocalDateTime checkedInAt;
}



package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sep490g65.fvcapi.enums.AuditActionType;
import sep490g65.fvcapi.enums.AuditRole;
import sep490g65.fvcapi.enums.AuditTargetType;

import java.time.LocalDateTime;

@Entity
@Table(name = "cycle_audit_logs",
        indexes = {
                @Index(name = "idx_audit_cycle_created", columnList = "cycle_id, created_at"),
                @Index(name = "idx_audit_role", columnList = "role"),
                @Index(name = "idx_audit_action", columnList = "action_type")
        })
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CycleAuditLog extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cycle_id", nullable = false)
    private ChallengeCycle cycle;

    @ManyToOne(optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuditRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 40)
    private AuditActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 30)
    private AuditTargetType targetType;

    @Column(name = "target_id", length = 64)
    private String targetId;

    @Column(columnDefinition = "text")
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}



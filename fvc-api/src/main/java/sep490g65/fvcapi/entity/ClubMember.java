package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "club_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(name = "student_code")
    private String studentCode;

    @Column(name = "phone")
    private String phone;

    @Column(name = "gender", length = 10)
    private String gender; // "Nam" | "Nữ" | others

    @Column(name = "joined_at")
    private LocalDate joinedAt;

    @Column(name = "department")
    private String department; // Phòng ban (e.g., "Chuyên môn")

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MemberStatus status;

    public enum MemberStatus { ACTIVE, INACTIVE, PENDING }
}



package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import com.vladmihalcea.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;

import sep490g65.fvcapi.enums.ApplicationFormType;

@Entity
@Table(name = "waitlist_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitlistEntry extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApplicationFormType formType;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String formData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "email", nullable = false)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_form_config_id", nullable = false)
    private ApplicationFormConfig applicationFormConfig;

    @Column(name = "is_processed", nullable = false)
    @Builder.Default
    private Boolean isProcessed = false; // Đánh dấu đã được chuyển sang submitted form chưa
}


package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import com.vladmihalcea.hibernate.type.json.JsonType;
import org.hibernate.annotations.Type;
import org.springframework.lang.Nullable;

import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.enums.ApplicationFormType;

@Entity
@Table(name = "submitted_application_forms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmittedApplicationForm extends BaseEntity {

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

    @Column(name = "email", nullable = true)
    private String email; // Always required, for cases when user_id is null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApplicationFormStatus status;

    @Column(length = 255)
    private String reviewerNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_form_config_id")
    private ApplicationFormConfig applicationFormConfig;
}


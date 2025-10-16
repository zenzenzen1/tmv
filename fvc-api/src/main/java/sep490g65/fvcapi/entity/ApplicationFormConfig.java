package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;
import sep490g65.fvcapi.enums.FormStatusConverter;
import sep490g65.fvcapi.entity.Competition;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "application_form_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationFormConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100, columnDefinition = "VARCHAR(100)")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApplicationFormType formType; // MEMBER_REGISTRATION | TOURNAMENT_REGISTRATION

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "applicationFormConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ApplicationFormField> fields = new ArrayList<>();

    @OneToMany(mappedBy = "applicationFormConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubmittedApplicationForm> submittedApplicationForms;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id")
    private Competition competition;

    @Convert(converter = FormStatusConverter.class)
    @Column(length = 20)
    private FormStatus status;

    @Column(name = "end_date")
    private LocalDateTime endDate;

}


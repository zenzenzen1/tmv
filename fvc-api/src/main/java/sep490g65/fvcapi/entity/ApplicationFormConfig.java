package sep490g65.fvcapi.entity;

import jakarta.persistence.*;
import lombok.*;
import sep490g65.fvcapi.enums.ApplicationFormType;

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

    @Column(nullable = false, length = 100)
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

}


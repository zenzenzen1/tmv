package sep490g65.fvcapi.entity;

import com.vladmihalcea.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "application_form_fields")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationFormField extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_form_id", nullable = false)
    private ApplicationFormConfig applicationFormConfig;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 50)
    private String name;  // key: fullName, dob, studentId

    @Column(nullable = false, length = 30)
    private String fieldType; // TEXT, DATE, NUMBER, EMAIL, SELECT...

    @Column(nullable = false)
    @Builder.Default
    private Boolean required = true;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private String options; // for options

    @Builder.Default
    private Integer sortOrder = 0;
}


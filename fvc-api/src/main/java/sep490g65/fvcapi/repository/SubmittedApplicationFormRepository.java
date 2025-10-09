package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.SubmittedApplicationForm;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.ApplicationFormStatus;

public interface SubmittedApplicationFormRepository extends JpaRepository<SubmittedApplicationForm, Long> {

    @Query("SELECT s FROM SubmittedApplicationForm s WHERE (:type IS NULL OR s.formType = :type)")
    Page<SubmittedApplicationForm> search(
            @Param("type") ApplicationFormType type,
            Pageable pageable
    );

    @Query("SELECT COUNT(s) FROM SubmittedApplicationForm s WHERE s.applicationFormConfig.id = :formId")
    long countByFormId(@Param("formId") String formId);

    @Query("SELECT COUNT(s) FROM SubmittedApplicationForm s WHERE s.applicationFormConfig.id = :formId AND s.status = :status")
    long countByFormIdAndStatus(@Param("formId") String formId, @Param("status") ApplicationFormStatus status);

    @Query("SELECT s FROM SubmittedApplicationForm s WHERE s.applicationFormConfig.id = :formId")
    Page<SubmittedApplicationForm> findByFormId(@Param("formId") String formId, Pageable pageable);
}



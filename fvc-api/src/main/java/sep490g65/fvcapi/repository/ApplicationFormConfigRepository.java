package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.enums.ApplicationFormType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationFormConfigRepository extends JpaRepository<ApplicationFormConfig, String> {

    @Query("SELECT afc FROM ApplicationFormConfig afc LEFT JOIN FETCH afc.fields ORDER BY afc.createdAt DESC")
    List<ApplicationFormConfig> findAllWithFields();

    @Query("SELECT afc FROM ApplicationFormConfig afc LEFT JOIN FETCH afc.fields WHERE afc.id = :id")
    Optional<ApplicationFormConfig> findByIdWithFields(@Param("id") String id);

    @Query("SELECT afc FROM ApplicationFormConfig afc LEFT JOIN FETCH afc.fields WHERE afc.formType = :formType")
    Optional<ApplicationFormConfig> findByFormTypeWithFields(@Param("formType") ApplicationFormType formType);

    Optional<ApplicationFormConfig> findByFormType(ApplicationFormType formType);
}

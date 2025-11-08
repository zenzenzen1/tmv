package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.WaitlistEntry;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, Long> {

    @Query("SELECT w FROM WaitlistEntry w WHERE w.applicationFormConfig.id = :formId AND w.isProcessed = false")
    List<WaitlistEntry> findByFormIdAndNotProcessed(@Param("formId") String formId);

    @Query("SELECT w FROM WaitlistEntry w WHERE w.applicationFormConfig.id = :formId AND w.email = :email AND w.isProcessed = false")
    Optional<WaitlistEntry> findByFormIdAndEmailAndNotProcessed(@Param("formId") String formId, @Param("email") String email);

    boolean existsByApplicationFormConfig_IdAndEmailIgnoreCaseAndIsProcessedFalse(String formId, String email);
}


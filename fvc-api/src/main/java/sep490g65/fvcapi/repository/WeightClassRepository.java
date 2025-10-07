package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.WeightClass;
import sep490g65.fvcapi.enums.Gender;
import sep490g65.fvcapi.enums.WeightClassStatus;

public interface WeightClassRepository extends JpaRepository<WeightClass, String> {

    @Query("SELECT w FROM WeightClass w WHERE " +
            "(:q IS NULL OR LOWER(COALESCE(w.note, '')) LIKE :q) AND " +
            "(:gender IS NULL OR w.gender = :gender) AND " +
            "(:status IS NULL OR w.status = :status)")
    Page<WeightClass> search(
            @Param("q") String q,
            @Param("gender") Gender gender,
            @Param("status") WeightClassStatus status,
            Pageable pageable);



    @Query("SELECT COUNT(w) > 0 FROM WeightClass w WHERE w.status = 'ACTIVE' AND w.gender = :gender AND " +
            "((:min < w.maxWeight AND :max > w.minWeight)) AND (:excludeId IS NULL OR w.id <> :excludeId)")
    boolean existsActiveOverlap(@Param("gender") Gender gender,
                                @Param("min") java.math.BigDecimal min,
                                @Param("max") java.math.BigDecimal max,
                                @Param("excludeId") String excludeId);
}



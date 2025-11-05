package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.Field;

public interface FieldRepository extends JpaRepository<Field, String> {

    @Query("SELECT f FROM Field f WHERE " +
            "(:q IS NULL OR LOWER(COALESCE(f.location, '')) LIKE :q) AND " +
            "(:isUsed IS NULL OR f.isUsed = :isUsed)")
    Page<Field> search(
            @Param("q") String q,
            @Param("isUsed") Boolean isUsed,
            Pageable pageable);
}


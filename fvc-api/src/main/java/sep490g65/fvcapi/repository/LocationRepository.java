package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import sep490g65.fvcapi.entity.Location;

import java.util.List;
import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, String>, JpaSpecificationExecutor<Location> {

    List<Location> findByIsActiveTrue();

    Page<Location> findByIsActiveTrue(Pageable pageable);

    Optional<Location> findByNameIgnoreCase(String name);

    Page<Location> findByNameContainingIgnoreCase(String name, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);
}



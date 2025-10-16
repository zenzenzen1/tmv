package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sep490g65.fvcapi.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    boolean existsByNameIgnoreCase(String name);
}



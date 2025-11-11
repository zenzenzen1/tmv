package sep490g65.fvcapi.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.SessionAttendance;
import sep490g65.fvcapi.enums.AttendanceStatus;

import java.util.List;
import java.util.Optional;

public interface SessionAttendanceRepository extends JpaRepository<SessionAttendance, String>, JpaSpecificationExecutor<SessionAttendance> {

    Page<SessionAttendance> findBySessionId(String sessionId, Pageable pageable);

    List<SessionAttendance> findBySessionId(String sessionId);

    Optional<SessionAttendance> findBySessionIdAndUserId(String sessionId, String userId);

    Page<SessionAttendance> findByUserId(String userId, Pageable pageable);

    List<SessionAttendance> findByUserId(String userId);

    @Query("SELECT COUNT(sa) FROM SessionAttendance sa WHERE sa.session.id = :sessionId AND sa.status IN :statuses")
    Long countBySessionIdAndStatusIn(@Param("sessionId") String sessionId, @Param("statuses") List<AttendanceStatus> statuses);
}



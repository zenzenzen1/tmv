package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.ArrangeSection;
import sep490g65.fvcapi.enums.ContentType;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArrangeSectionRepository extends JpaRepository<ArrangeSection, String> {
    
    @Query("SELECT s FROM ArrangeSection s WHERE s.competition.id = :competitionId AND s.contentType = :contentType")
    List<ArrangeSection> findByCompetitionIdAndContentType(
            @Param("competitionId") String competitionId,
            @Param("contentType") ContentType contentType
    );
    
    @Query("SELECT s FROM ArrangeSection s WHERE s.competition.id = :competitionId " +
           "AND s.contentId = :contentId AND s.contentType = :contentType")
    Optional<ArrangeSection> findByCompetitionIdAndContentIdAndContentType(
            @Param("competitionId") String competitionId,
            @Param("contentId") String contentId,
            @Param("contentType") ContentType contentType
    );
    
    void deleteByCompetitionIdAndContentType(String competitionId, ContentType contentType);
}


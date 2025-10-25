package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sep490g65.fvcapi.entity.CompetitionOrder;

import java.util.List;

public interface CompetitionOrderRepository extends JpaRepository<CompetitionOrder, String> {
    
    List<CompetitionOrder> findByCompetition_IdOrderByOrderIndexAsc(String competitionId);
    
    List<CompetitionOrder> findByCompetition_IdAndContentSelection_IdOrderByOrderIndexAsc(
            String competitionId, 
            String contentSelectionId
    );
    
    @Modifying
    @Query("DELETE FROM CompetitionOrder co WHERE co.competition.id = :competitionId")
    void deleteByCompetitionId(@Param("competitionId") String competitionId);
    
    boolean existsByCompetition_IdAndOrderIndex(String competitionId, Integer orderIndex);
}



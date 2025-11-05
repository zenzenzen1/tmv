package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.ArrangeItem;

import java.util.List;

@Repository
public interface ArrangeItemRepository extends JpaRepository<ArrangeItem, String> {
    
    List<ArrangeItem> findBySectionIdOrderByOrderIndex(String sectionId);
    
    @Modifying
    @Query("DELETE FROM ArrangeItem i WHERE i.section.id = :sectionId")
    void deleteBySectionId(@Param("sectionId") String sectionId);
    
    @Query("SELECT i FROM ArrangeItem i WHERE i.section.id = :sectionId AND i.refId = :refId")
    boolean existsBySectionIdAndRefId(@Param("sectionId") String sectionId, @Param("refId") String refId);
}


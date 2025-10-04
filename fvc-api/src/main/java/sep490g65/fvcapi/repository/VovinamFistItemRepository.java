package sep490g65.fvcapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sep490g65.fvcapi.entity.VovinamFistItem;

import java.util.List;

@Repository
public interface VovinamFistItemRepository extends JpaRepository<VovinamFistItem, String> {

    @Query("SELECT vfi FROM VovinamFistItem vfi WHERE vfi.vovinamFistConfig.id = :configId")
    List<VovinamFistItem> findByVovinamFistConfigId(@Param("configId") String configId);

    @Query("SELECT vfi FROM VovinamFistItem vfi WHERE vfi.parent IS NULL AND vfi.vovinamFistConfig.id = :configId")
    List<VovinamFistItem> findRootItemsByConfigId(@Param("configId") String configId);

    @Query("SELECT vfi FROM VovinamFistItem vfi WHERE vfi.parent.id = :parentId")
    List<VovinamFistItem> findByParentId(@Param("parentId") String parentId);
}

package sep490g65.fvcapi.service;

import sep490g65.fvcapi.entity.CompetitionVovinamFist;

import java.util.List;

public interface CompetitionVovinamFistService {
    
    /**
     * Add a VovinamFistConfig to a Competition
     */
    CompetitionVovinamFist addVovinamFistToCompetition(String competitionId, String vovinamFistConfigId, Integer sortOrder);
    
    /**
     * Remove a VovinamFistConfig from a Competition
     */
    void removeVovinamFistFromCompetition(String competitionId, String vovinamFistConfigId);
    
    /**
     * Get all VovinamFistConfigs for a Competition
     */
    List<CompetitionVovinamFist> getVovinamFistConfigsForCompetition(String competitionId);
    
    /**
     * Get all Competitions for a VovinamFistConfig
     */
    List<CompetitionVovinamFist> getCompetitionsForVovinamFistConfig(String vovinamFistConfigId);
    
    /**
     * Update the sort order of a VovinamFistConfig in a Competition
     */
    CompetitionVovinamFist updateSortOrder(String competitionId, String vovinamFistConfigId, Integer sortOrder);
    
    /**
     * Activate/Deactivate a VovinamFistConfig in a Competition
     */
    CompetitionVovinamFist setActive(String competitionId, String vovinamFistConfigId, Boolean isActive);
}
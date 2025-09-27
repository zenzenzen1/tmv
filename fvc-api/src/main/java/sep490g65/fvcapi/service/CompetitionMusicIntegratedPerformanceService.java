package sep490g65.fvcapi.service;

import sep490g65.fvcapi.entity.CompetitionMusicIntegratedPerformance;

import java.util.List;

public interface CompetitionMusicIntegratedPerformanceService {
    
    /**
     * Add a MusicIntegratedPerformance to a Competition
     */
    CompetitionMusicIntegratedPerformance addMusicPerformanceToCompetition(
            String competitionId, 
            String musicPerformanceId, 
            Integer sortOrder, 
            Integer performanceSequence,
            String notes
    );
    
    /**
     * Remove a MusicIntegratedPerformance from a Competition
     */
    void removeMusicPerformanceFromCompetition(String competitionId, String musicPerformanceId);
    
    /**
     * Get all MusicIntegratedPerformances for a Competition
     */
    List<CompetitionMusicIntegratedPerformance> getMusicPerformancesForCompetition(String competitionId);
    
    /**
     * Get all Competitions for a MusicIntegratedPerformance
     */
    List<CompetitionMusicIntegratedPerformance> getCompetitionsForMusicPerformance(String musicPerformanceId);
    
    /**
     * Update the sort order of a MusicIntegratedPerformance in a Competition
     */
    CompetitionMusicIntegratedPerformance updateSortOrder(String competitionId, String musicPerformanceId, Integer sortOrder);
    
    /**
     * Update the performance sequence of a MusicIntegratedPerformance in a Competition
     */
    CompetitionMusicIntegratedPerformance updatePerformanceSequence(String competitionId, String musicPerformanceId, Integer performanceSequence);
    
    /**
     * Activate/Deactivate a MusicIntegratedPerformance in a Competition
     */
    CompetitionMusicIntegratedPerformance setActive(String competitionId, String musicPerformanceId, Boolean isActive);
    
    /**
     * Get MusicIntegratedPerformances by performance type for a Competition
     */
    List<CompetitionMusicIntegratedPerformance> getMusicPerformancesByType(String competitionId, String performanceType);
    
    /**
     * Update notes for a MusicIntegratedPerformance in a Competition
     */
    CompetitionMusicIntegratedPerformance updateNotes(String competitionId, String musicPerformanceId, String notes);
}
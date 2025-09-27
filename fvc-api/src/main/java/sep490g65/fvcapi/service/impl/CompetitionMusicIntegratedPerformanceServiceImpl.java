package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.CompetitionMusicIntegratedPerformance;
import sep490g65.fvcapi.entity.MusicIntegratedPerformance;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.service.CompetitionMusicIntegratedPerformanceService;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CompetitionMusicIntegratedPerformanceServiceImpl implements CompetitionMusicIntegratedPerformanceService {

    private final CompetitionMusicIntegratedPerformanceRepository competitionMusicPerformanceRepository;

    @Override
    public CompetitionMusicIntegratedPerformance addMusicPerformanceToCompetition(
            String competitionId, 
            String musicPerformanceId, 
            Integer sortOrder, 
            Integer performanceSequence,
            String notes
    ) {
        // Check if relationship already exists
        Optional<CompetitionMusicIntegratedPerformance> existing = competitionMusicPerformanceRepository
                .findByCompetitionIdAndMusicPerformanceId(competitionId, musicPerformanceId);
        
        if (existing.isPresent()) {
            CompetitionMusicIntegratedPerformance relation = existing.get();
            relation.setIsActive(true);
            if (sortOrder != null) {
                relation.setSortOrder(sortOrder);
            }
            if (performanceSequence != null) {
                relation.setPerformanceSequence(performanceSequence);
            }
            if (notes != null) {
                relation.setNotes(notes);
            }
            return competitionMusicPerformanceRepository.save(relation);
        }

        // Create new relationship
        CompetitionMusicIntegratedPerformance relation = CompetitionMusicIntegratedPerformance.builder()
                .competition(Competition.builder().id(competitionId).build())
                .musicIntegratedPerformance(MusicIntegratedPerformance.builder().id(musicPerformanceId).build())
                .isActive(true)
                .sortOrder(sortOrder)
                .performanceSequence(performanceSequence)
                .notes(notes)
                .build();

        return competitionMusicPerformanceRepository.save(relation);
    }

    @Override
    public void removeMusicPerformanceFromCompetition(String competitionId, String musicPerformanceId) {
        Optional<CompetitionMusicIntegratedPerformance> relation = competitionMusicPerformanceRepository
                .findByCompetitionIdAndMusicPerformanceId(competitionId, musicPerformanceId);
        
        if (relation.isPresent()) {
            competitionMusicPerformanceRepository.delete(relation.get());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompetitionMusicIntegratedPerformance> getMusicPerformancesForCompetition(String competitionId) {
        return competitionMusicPerformanceRepository.findByCompetitionIdOrderByPerformanceSequence(competitionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompetitionMusicIntegratedPerformance> getCompetitionsForMusicPerformance(String musicPerformanceId) {
        return competitionMusicPerformanceRepository.findByMusicIntegratedPerformanceId(musicPerformanceId);
    }

    @Override
    public CompetitionMusicIntegratedPerformance updateSortOrder(String competitionId, String musicPerformanceId, Integer sortOrder) {
        CompetitionMusicIntegratedPerformance relation = competitionMusicPerformanceRepository
                .findByCompetitionIdAndMusicPerformanceId(competitionId, musicPerformanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Relationship not found"));
        
        relation.setSortOrder(sortOrder);
        return competitionMusicPerformanceRepository.save(relation);
    }

    @Override
    public CompetitionMusicIntegratedPerformance updatePerformanceSequence(String competitionId, String musicPerformanceId, Integer performanceSequence) {
        CompetitionMusicIntegratedPerformance relation = competitionMusicPerformanceRepository
                .findByCompetitionIdAndMusicPerformanceId(competitionId, musicPerformanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Relationship not found"));
        
        relation.setPerformanceSequence(performanceSequence);
        return competitionMusicPerformanceRepository.save(relation);
    }

    @Override
    public CompetitionMusicIntegratedPerformance setActive(String competitionId, String musicPerformanceId, Boolean isActive) {
        CompetitionMusicIntegratedPerformance relation = competitionMusicPerformanceRepository
                .findByCompetitionIdAndMusicPerformanceId(competitionId, musicPerformanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Relationship not found"));
        
        relation.setIsActive(isActive);
        return competitionMusicPerformanceRepository.save(relation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompetitionMusicIntegratedPerformance> getMusicPerformancesByType(String competitionId, String performanceType) {
        return competitionMusicPerformanceRepository.findByCompetitionIdAndPerformanceType(competitionId, performanceType);
    }

    @Override
    public CompetitionMusicIntegratedPerformance updateNotes(String competitionId, String musicPerformanceId, String notes) {
        CompetitionMusicIntegratedPerformance relation = competitionMusicPerformanceRepository
                .findByCompetitionIdAndMusicPerformanceId(competitionId, musicPerformanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Relationship not found"));
        
        relation.setNotes(notes);
        return competitionMusicPerformanceRepository.save(relation);
    }
}
package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.CompetitionVovinamFist;
import sep490g65.fvcapi.entity.VovinamFistConfig;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.CompetitionVovinamFistRepository;
import sep490g65.fvcapi.service.CompetitionVovinamFistService;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CompetitionVovinamFistServiceImpl implements CompetitionVovinamFistService {

    private final CompetitionVovinamFistRepository competitionVovinamFistRepository;

    @Override
    public CompetitionVovinamFist addVovinamFistToCompetition(String competitionId, String vovinamFistConfigId, Integer sortOrder) {
        // Check if relationship already exists
        Optional<CompetitionVovinamFist> existing = competitionVovinamFistRepository
                .findByCompetitionIdAndVovinamFistConfigId(competitionId, vovinamFistConfigId);
        
        if (existing.isPresent()) {
            CompetitionVovinamFist relation = existing.get();
            relation.setIsActive(true);
            if (sortOrder != null) {
                relation.setSortOrder(sortOrder);
            }
            return competitionVovinamFistRepository.save(relation);
        }

        // Create new relationship
        CompetitionVovinamFist relation = CompetitionVovinamFist.builder()
                .competition(Competition.builder().id(competitionId).build())
                .vovinamFistConfig(VovinamFistConfig.builder().id(vovinamFistConfigId).build())
                .isActive(true)
                .sortOrder(sortOrder)
                .build();

        return competitionVovinamFistRepository.save(relation);
    }

    @Override
    public void removeVovinamFistFromCompetition(String competitionId, String vovinamFistConfigId) {
        Optional<CompetitionVovinamFist> relation = competitionVovinamFistRepository
                .findByCompetitionIdAndVovinamFistConfigId(competitionId, vovinamFistConfigId);
        
        if (relation.isPresent()) {
            competitionVovinamFistRepository.delete(relation.get());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompetitionVovinamFist> getVovinamFistConfigsForCompetition(String competitionId) {
        return competitionVovinamFistRepository.findByCompetitionIdOrderBySortOrder(competitionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompetitionVovinamFist> getCompetitionsForVovinamFistConfig(String vovinamFistConfigId) {
        return competitionVovinamFistRepository.findByVovinamFistConfigId(vovinamFistConfigId);
    }

    @Override
    public CompetitionVovinamFist updateSortOrder(String competitionId, String vovinamFistConfigId, Integer sortOrder) {
        CompetitionVovinamFist relation = competitionVovinamFistRepository
                .findByCompetitionIdAndVovinamFistConfigId(competitionId, vovinamFistConfigId)
                .orElseThrow(() -> new ResourceNotFoundException("Relationship not found"));
        
        relation.setSortOrder(sortOrder);
        return competitionVovinamFistRepository.save(relation);
    }

    @Override
    public CompetitionVovinamFist setActive(String competitionId, String vovinamFistConfigId, Boolean isActive) {
        CompetitionVovinamFist relation = competitionVovinamFistRepository
                .findByCompetitionIdAndVovinamFistConfigId(competitionId, vovinamFistConfigId)
                .orElseThrow(() -> new ResourceNotFoundException("Relationship not found"));
        
        relation.setIsActive(isActive);
        return competitionVovinamFistRepository.save(relation);
    }
}
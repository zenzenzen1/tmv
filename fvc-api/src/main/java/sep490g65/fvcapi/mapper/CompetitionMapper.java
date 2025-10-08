package sep490g65.fvcapi.mapper;

import org.springframework.stereotype.Component;
import sep490g65.fvcapi.dto.request.CreateCompetitionRequest;
import sep490g65.fvcapi.dto.request.UpdateCompetitionRequest;
import sep490g65.fvcapi.dto.response.CompetitionResponse;
import sep490g65.fvcapi.dto.response.FistConfigResponse;
import sep490g65.fvcapi.dto.response.FistItemResponse;
import sep490g65.fvcapi.dto.response.MusicContentResponse;
import sep490g65.fvcapi.dto.response.WeightClassResponse;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.CompetitionFistItemSelection;
import sep490g65.fvcapi.entity.CompetitionMusicIntegratedPerformance;
import sep490g65.fvcapi.entity.VovinamSparringConfig;
import sep490g65.fvcapi.entity.VovinamSparringConfigWeightClass;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class CompetitionMapper {
    
    public Competition toEntity(CreateCompetitionRequest request) {
        Competition competition = new Competition();
        competition.setName(request.getName());
        competition.setDescription(request.getDescription());
        competition.setRegistrationStartDate(request.getRegistrationStartDate());
        competition.setRegistrationEndDate(request.getRegistrationEndDate());
        competition.setWeighInDate(request.getWeighInDate());
        competition.setStartDate(request.getStartDate());
        competition.setEndDate(request.getEndDate());
        competition.setOpeningCeremonyTime(request.getOpeningCeremonyTime());
        competition.setDrawDate(request.getDrawDate());
        competition.setLocation(request.getLocation());
        return competition;
    }
    
    public CompetitionResponse toResponse(Competition competition) {
        return CompetitionResponse.builder()
                .id(competition.getId())
                .name(competition.getName())
                .description(competition.getDescription())
                .registrationStartDate(competition.getRegistrationStartDate())
                .registrationEndDate(competition.getRegistrationEndDate())
                .weighInDate(competition.getWeighInDate())
                .startDate(competition.getStartDate())
                .endDate(competition.getEndDate())
                .openingCeremonyTime(competition.getOpeningCeremonyTime())
                .drawDate(competition.getDrawDate())
                .location(competition.getLocation())
                .status(competition.getStatus())
                .numberOfParticipants(competition.getNumberOfParticipants())
                .createdAt(competition.getCreatedAt())
                .updatedAt(competition.getUpdatedAt())
                .build();
    }
    
    public CompetitionResponse toResponse(Competition competition, List<CompetitionFistItemSelection> fistItemSelections) {
        CompetitionResponse response = toResponse(competition);
        
        // Extract unique fist configs from selections
        List<FistConfigResponse> fistConfigs = fistItemSelections.stream()
                .map(selection -> selection.getVovinamFistConfig())
                .distinct()
                .map(config -> FistConfigResponse.builder()
                        .id(config.getId())
                        .name(config.getName())
                        .description(config.getDescription())
                        .build())
                .collect(Collectors.toList());
        
        // Group fist item selections by fist config ID
        Map<String, List<FistItemResponse>> fistConfigItemSelections = fistItemSelections.stream()
                .collect(Collectors.groupingBy(
                        selection -> selection.getVovinamFistConfig().getId(),
                        Collectors.mapping(
                                selection -> FistItemResponse.builder()
                                        .id(selection.getVovinamFistItem().getId())
                                        .name(selection.getVovinamFistItem().getName())
                                        .description(selection.getVovinamFistItem().getDescription())
                                        .level(selection.getVovinamFistItem().getLevel())
                                        .parentId(selection.getVovinamFistItem().getParent() != null ? 
                                                selection.getVovinamFistItem().getParent().getId() : null)
                                        .build(),
                                Collectors.toList()
                        )
                ));
        
        response.setVovinamFistConfigs(fistConfigs);
        response.setFistConfigItemSelections(fistConfigItemSelections);
        return response;
    }
    
    public CompetitionResponse toResponse(Competition competition, List<CompetitionFistItemSelection> fistItemSelections, 
                                        VovinamSparringConfig sparringConfig, List<VovinamSparringConfigWeightClass> weightClassLinks) {
        CompetitionResponse response = toResponse(competition, fistItemSelections);
        
        // Set sparring configuration
        if (sparringConfig != null) {
            response.setNumberOfRounds(sparringConfig.getNumberOfRounds());
            response.setRoundDurationSeconds(sparringConfig.getRoundDurationSeconds());
            response.setAllowExtraRound(sparringConfig.getAllowExtraRound());
            response.setMaxExtraRounds(sparringConfig.getMaxExtraRounds());
            response.setTieBreakRule(sparringConfig.getTieBreakRule());
            response.setAssessorCount(sparringConfig.getAssessorCount());
            response.setInjuryTimeoutSeconds(sparringConfig.getInjuryTimeoutSeconds());
        }
        
        // Set weight classes
        List<WeightClassResponse> weightClasses = weightClassLinks.stream()
                .map(link -> mapWeightClassLink(link))
                .collect(Collectors.toList());
        
        response.setWeightClasses(weightClasses);
        return response;
    }
    
    public CompetitionResponse toResponse(Competition competition, List<CompetitionFistItemSelection> fistItemSelections, 
                                        VovinamSparringConfig sparringConfig, List<VovinamSparringConfigWeightClass> weightClassLinks,
                                        List<CompetitionMusicIntegratedPerformance> musicPerformanceLinks) {
        CompetitionResponse response = toResponse(competition, fistItemSelections, sparringConfig, weightClassLinks);
        
        // Set music performances
        List<MusicContentResponse> musicPerformances = musicPerformanceLinks.stream()
                .map(this::mapMusicPerformanceLink)
                .collect(Collectors.toList());
        
        response.setMusicPerformances(musicPerformances);
        return response;
    }
    
    private WeightClassResponse mapWeightClassLink(VovinamSparringConfigWeightClass link) {
        return WeightClassResponse.builder()
                .id(link.getWeightClass().getId())
                .gender(link.getWeightClass().getGender())
                .minWeight(link.getWeightClass().getMinWeight())
                .maxWeight(link.getWeightClass().getMaxWeight())
                .note(link.getWeightClass().getNote())
                .status(link.getWeightClass().getStatus())
                .createdAt(link.getWeightClass().getCreatedAt())
                .updatedAt(link.getWeightClass().getUpdatedAt())
                .build();
    }
    
    private MusicContentResponse mapMusicPerformanceLink(CompetitionMusicIntegratedPerformance link) {
        return MusicContentResponse.builder()
                .id(link.getMusicIntegratedPerformance().getId())
                .name(link.getMusicIntegratedPerformance().getName())
                .description(link.getMusicIntegratedPerformance().getDescription())
                .isActive(link.getMusicIntegratedPerformance().getIsActive())
                .build();
    }
    
    public void updateEntity(UpdateCompetitionRequest request, Competition competition) {
        if (request.getName() != null) {
            competition.setName(request.getName());
        }
        if (request.getDescription() != null) {
            competition.setDescription(request.getDescription());
        }
        if (request.getRegistrationStartDate() != null) {
            competition.setRegistrationStartDate(request.getRegistrationStartDate());
        }
        if (request.getRegistrationEndDate() != null) {
            competition.setRegistrationEndDate(request.getRegistrationEndDate());
        }
        if (request.getWeighInDate() != null) {
            competition.setWeighInDate(request.getWeighInDate());
        }
        if (request.getStartDate() != null) {
            competition.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            competition.setEndDate(request.getEndDate());
        }
        if (request.getOpeningCeremonyTime() != null) {
            competition.setOpeningCeremonyTime(request.getOpeningCeremonyTime());
        }
        if (request.getDrawDate() != null) {
            competition.setDrawDate(request.getDrawDate());
        }
        if (request.getLocation() != null) {
            competition.setLocation(request.getLocation());
        }
    }
}

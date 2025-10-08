package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CompetitionFilters;
import sep490g65.fvcapi.dto.request.CreateCompetitionRequest;
import sep490g65.fvcapi.dto.request.UpdateCompetitionRequest;
import sep490g65.fvcapi.dto.response.CompetitionResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.CompetitionFistItemSelection;
import sep490g65.fvcapi.entity.CompetitionMusicIntegratedPerformance;
import sep490g65.fvcapi.entity.MusicIntegratedPerformance;
import sep490g65.fvcapi.entity.VovinamFistConfig;
import sep490g65.fvcapi.entity.VovinamFistItem;
import sep490g65.fvcapi.entity.VovinamSparringConfig;
import sep490g65.fvcapi.entity.VovinamSparringConfigWeightClass;
import sep490g65.fvcapi.entity.WeightClass;
import sep490g65.fvcapi.enums.ErrorCode;
import sep490g65.fvcapi.enums.TournamentStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.mapper.CompetitionMapper;
import sep490g65.fvcapi.repository.CompetitionFistItemSelectionRepository;
import sep490g65.fvcapi.repository.CompetitionMusicIntegratedPerformanceRepository;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.repository.MusicIntegratedPerformanceRepository;
import sep490g65.fvcapi.repository.VovinamFistConfigRepository;
import sep490g65.fvcapi.repository.VovinamFistItemRepository;
import sep490g65.fvcapi.repository.VovinamSparringConfigRepository;
import sep490g65.fvcapi.repository.VovinamSparringConfigWeightClassRepository;
import sep490g65.fvcapi.repository.WeightClassRepository;
import sep490g65.fvcapi.service.CompetitionService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CompetitionServiceImpl implements CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionMapper competitionMapper;
    private final CompetitionFistItemSelectionRepository fistItemSelectionRepository;
    private final VovinamFistConfigRepository fistConfigRepository;
    private final VovinamFistItemRepository fistItemRepository;
    private final VovinamSparringConfigRepository sparringConfigRepository;
    private final VovinamSparringConfigWeightClassRepository sparringConfigWeightClassRepository;
    private final WeightClassRepository weightClassRepository;
    private final CompetitionMusicIntegratedPerformanceRepository musicPerformanceRepository;
    private final MusicIntegratedPerformanceRepository musicIntegratedPerformanceRepository;
    
    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<CompetitionResponse> getAllCompetitions(CompetitionFilters filters) {
        try {
            // Parse status filter
            TournamentStatus status = null;
            if (filters.getStatus() != null && !filters.getStatus().trim().isEmpty()) {
                try {
                    status = TournamentStatus.valueOf(filters.getStatus().toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status filter: {}", filters.getStatus());
                }
            }
            
            // Parse year filter
            Integer year = null;
            if (filters.getYear() != null && !filters.getYear().trim().isEmpty()) {
                try {
                    year = Integer.parseInt(filters.getYear());
                } catch (NumberFormatException e) {
                    log.warn("Invalid year filter: {}", filters.getYear());
                }
            }
            
            // Create pageable
            Sort sort = Sort.by(filters.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, filters.getSortBy());
            Pageable pageable = PageRequest.of(filters.getPage(), filters.getSize(), sort);
            
            // Execute query
            Page<Competition> competitions = competitionRepository.findCompetitionsWithFilters(
                    filters.getSearchTerm(),
                    status,
                    year,
                    filters.getLocation(),
                    pageable
            );
            
            // Convert to response DTOs
            List<CompetitionResponse> competitionResponses = competitions.getContent().stream()
                    .map(competitionMapper::toResponse)
                    .collect(Collectors.toList());
            
            // Build pagination response
            return PaginationResponse.<CompetitionResponse>builder()
                    .content(competitionResponses)
                    .page(competitions.getNumber())
                    .size(competitions.getSize())
                    .totalElements(competitions.getTotalElements())
                    .totalPages(competitions.getTotalPages())
                    .first(competitions.isFirst())
                    .last(competitions.isLast())
                    .hasNext(competitions.hasNext())
                    .hasPrevious(competitions.hasPrevious())
                    .build();
                    
        } catch (Exception e) {
            log.error("Error fetching competitions", e);
            throw new BusinessException(MessageConstants.COMPETITION_FETCH_ERROR, ErrorCode.COMPETITION_FETCH_ERROR.getCode());
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public CompetitionResponse getCompetitionById(String id) {
        try {
            Competition competition = competitionRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Competition not found with id: " + id));
            
            // Fetch fist item selections for this competition
            List<CompetitionFistItemSelection> fistItemSelections = fistItemSelectionRepository.findByCompetitionId(id);
            
            // Fetch sparring config and weight classes for this competition
            VovinamSparringConfig sparringConfig = sparringConfigRepository.findByCompetitionId(id).orElse(null);
            List<VovinamSparringConfigWeightClass> weightClassLinks = sparringConfig != null ? 
                    sparringConfigWeightClassRepository.findBySparringConfigId(sparringConfig.getId()) : 
                    List.of();
            
            // Fetch music performances for this competition
            List<CompetitionMusicIntegratedPerformance> musicPerformanceLinks = musicPerformanceRepository.findByCompetitionId(id);
            
            return competitionMapper.toResponse(competition, fistItemSelections, sparringConfig, weightClassLinks, musicPerformanceLinks);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching competition with id: {}", id, e);
            throw new BusinessException(MessageConstants.COMPETITION_FETCH_ERROR, ErrorCode.COMPETITION_FETCH_ERROR.getCode());
        }
    }
    
    @Override
    public CompetitionResponse createCompetition(CreateCompetitionRequest request) {
        try {
            // Validate business rules
            if (competitionRepository.existsByName(request.getName())) {
                throw new BusinessException(
                        String.format(MessageConstants.COMPETITION_ALREADY_EXISTS, request.getName()),
                        ErrorCode.COMPETITION_ALREADY_EXISTS.getCode()
                );
            }
            
            // Validate date ranges
            if (request.getRegistrationStartDate().isAfter(request.getRegistrationEndDate())) {
                throw new BusinessException(
                        MessageConstants.REGISTRATION_START_AFTER_END,
                        ErrorCode.REGISTRATION_START_AFTER_END.getCode()
                );
            }
            
            if (request.getStartDate().isAfter(request.getEndDate())) {
                throw new BusinessException(
                        MessageConstants.COMPETITION_START_AFTER_END,
                        ErrorCode.COMPETITION_START_AFTER_END.getCode()
                );
            }
            
            // Create competition entity
            Competition competition = competitionMapper.toEntity(request);
            Competition savedCompetition = competitionRepository.save(competition);
            
            // Create and save sparring configuration
            VovinamSparringConfig sparringConfig = VovinamSparringConfig.builder()
                    .competition(savedCompetition)
                    .numberOfRounds(request.getNumberOfRounds())
                    .roundDurationSeconds(request.getRoundDurationSeconds())
                    .allowExtraRound(request.getAllowExtraRound())
                    .maxExtraRounds(request.getMaxExtraRounds())
                    .tieBreakRule(request.getTieBreakRule())
                    .assessorCount(request.getAssessorCount())
                    .injuryTimeoutSeconds(request.getInjuryTimeoutSeconds())
                    .build();
            
            VovinamSparringConfig savedSparringConfig = sparringConfigRepository.save(sparringConfig);
            
            // Link weight classes to sparring config
            if (request.getWeightClassIds() != null && !request.getWeightClassIds().isEmpty()) {
                for (String weightClassId : request.getWeightClassIds()) {
                    WeightClass weightClass = weightClassRepository.findById(weightClassId)
                            .orElseThrow(() -> new BusinessException(
                                    String.format(MessageConstants.WEIGHT_CLASS_NOT_FOUND, weightClassId),
                                    ErrorCode.WEIGHT_CLASS_NOT_FOUND.getCode()
                            ));
                    
                    VovinamSparringConfigWeightClass weightClassLink = VovinamSparringConfigWeightClass.builder()
                            .vovinamSparringConfig(savedSparringConfig)
                            .weightClass(weightClass)
                            .build();
                    
                    sparringConfigWeightClassRepository.save(weightClassLink);
                }
            }
            
            // Link music performances
            if (request.getMusicPerformanceIds() != null && !request.getMusicPerformanceIds().isEmpty()) {
                for (String musicPerformanceId : request.getMusicPerformanceIds()) {
                    MusicIntegratedPerformance musicPerformance = musicIntegratedPerformanceRepository.findById(musicPerformanceId)
                            .orElseThrow(() -> new BusinessException(
                                    String.format(MessageConstants.MUSIC_PERFORMANCE_NOT_FOUND, musicPerformanceId),
                                    ErrorCode.MUSIC_PERFORMANCE_NOT_FOUND.getCode()
                            ));
                    
                    CompetitionMusicIntegratedPerformance musicLink = new CompetitionMusicIntegratedPerformance();
                    musicLink.setCompetition(savedCompetition);
                    musicLink.setMusicIntegratedPerformance(musicPerformance);
                    musicPerformanceRepository.save(musicLink);
                }
            }
            
            // Handle fist content selections
            if (request.getFistConfigItemSelections() != null && !request.getFistConfigItemSelections().isEmpty()) {
                for (var entry : request.getFistConfigItemSelections().entrySet()) {
                    String fistConfigId = entry.getKey();
                    List<String> selectedItemIds = entry.getValue();
                    
                    // Validate fist config exists
                    VovinamFistConfig fistConfig = fistConfigRepository.findById(fistConfigId)
                            .orElseThrow(() -> new BusinessException(
                                    String.format(MessageConstants.FIST_CONFIG_NOT_FOUND, fistConfigId),
                                    ErrorCode.FIST_CONFIG_NOT_FOUND.getCode()
                            ));
                    
                    // Create fist item selections
                    for (String itemId : selectedItemIds) {
                        VovinamFistItem fistItem = fistItemRepository.findById(itemId)
                                .orElseThrow(() -> new BusinessException(
                                        String.format(MessageConstants.FIST_ITEM_NOT_FOUND, itemId),
                                        ErrorCode.FIST_ITEM_NOT_FOUND.getCode()
                                ));
                        
                        // Validate that the item belongs to the config
                        if (!fistItem.getVovinamFistConfig().getId().equals(fistConfigId)) {
                            throw new BusinessException(
                                    String.format(MessageConstants.INVALID_FIST_ITEM_CONFIG, itemId, fistConfigId),
                                    ErrorCode.INVALID_FIST_ITEM_CONFIG.getCode()
                            );
                        }
                        
                        CompetitionFistItemSelection selection = new CompetitionFistItemSelection();
                        selection.setCompetition(savedCompetition);
                        selection.setVovinamFistConfig(fistConfig);
                        selection.setVovinamFistItem(fistItem);
                        fistItemSelectionRepository.save(selection);
                    }
                }
            }
            
            log.info("Competition created successfully with ID: {}", savedCompetition.getId());
            return competitionMapper.toResponse(savedCompetition);
            
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating competition", e);
            throw new BusinessException(MessageConstants.COMPETITION_CREATE_ERROR, ErrorCode.COMPETITION_CREATE_ERROR.getCode());
        }
    }
    
    @Override
    public CompetitionResponse updateCompetition(String id, UpdateCompetitionRequest request) {
        try {
            Competition competition = competitionRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.COMPETITION_NOT_FOUND, id)));
            
            // Check if name is being changed and if it already exists
            if (request.getName() != null && !request.getName().equals(competition.getName())) {
                if (competitionRepository.existsByName(request.getName())) {
                    throw new BusinessException(
                            String.format(MessageConstants.COMPETITION_ALREADY_EXISTS, request.getName()),
                            ErrorCode.COMPETITION_ALREADY_EXISTS.getCode()
                    );
                }
            }
            
            // Update entity
            competitionMapper.updateEntity(request, competition);
            Competition updatedCompetition = competitionRepository.save(competition);
            
            // Handle sparring config update
            VovinamSparringConfig existingSparringConfig = sparringConfigRepository.findByCompetitionId(id)
                    .orElse(null);
            
            if (existingSparringConfig != null) {
                // Update existing sparring config
                if (request.getNumberOfRounds() != null) {
                    existingSparringConfig.setNumberOfRounds(request.getNumberOfRounds());
                }
                if (request.getRoundDurationSeconds() != null) {
                    existingSparringConfig.setRoundDurationSeconds(request.getRoundDurationSeconds());
                }
                if (request.getAllowExtraRound() != null) {
                    existingSparringConfig.setAllowExtraRound(request.getAllowExtraRound());
                }
                if (request.getMaxExtraRounds() != null) {
                    existingSparringConfig.setMaxExtraRounds(request.getMaxExtraRounds());
                }
                if (request.getTieBreakRule() != null) {
                    existingSparringConfig.setTieBreakRule(request.getTieBreakRule());
                }
                if (request.getAssessorCount() != null) {
                    existingSparringConfig.setAssessorCount(request.getAssessorCount());
                }
                if (request.getInjuryTimeoutSeconds() != null) {
                    existingSparringConfig.setInjuryTimeoutSeconds(request.getInjuryTimeoutSeconds());
                }
                
                sparringConfigRepository.save(existingSparringConfig);
                
                // Update weight class links if provided
                if (request.getWeightClassIds() != null) {
                    // Delete existing weight class links
                    sparringConfigWeightClassRepository.deleteByVovinamSparringConfigId(existingSparringConfig.getId());
                    
                    // Create new weight class links
                    if (!request.getWeightClassIds().isEmpty()) {
                        for (String weightClassId : request.getWeightClassIds()) {
                            WeightClass weightClass = weightClassRepository.findById(weightClassId)
                                    .orElseThrow(() -> new BusinessException(
                                            String.format(MessageConstants.WEIGHT_CLASS_NOT_FOUND, weightClassId),
                                            ErrorCode.WEIGHT_CLASS_NOT_FOUND.getCode()
                                    ));
                            
                            VovinamSparringConfigWeightClass weightClassLink = VovinamSparringConfigWeightClass.builder()
                                    .vovinamSparringConfig(existingSparringConfig)
                                    .weightClass(weightClass)
                                    .build();
                            
                            sparringConfigWeightClassRepository.save(weightClassLink);
                        }
                    }
                }
            } else if (request.getNumberOfRounds() != null || request.getWeightClassIds() != null) {
                // Create new sparring config if it doesn't exist but sparring data is provided
                VovinamSparringConfig newSparringConfig = VovinamSparringConfig.builder()
                        .competition(updatedCompetition)
                        .numberOfRounds(request.getNumberOfRounds() != null ? request.getNumberOfRounds() : 2)
                        .roundDurationSeconds(request.getRoundDurationSeconds() != null ? request.getRoundDurationSeconds() : 90)
                        .allowExtraRound(request.getAllowExtraRound() != null ? request.getAllowExtraRound() : true)
                        .maxExtraRounds(request.getMaxExtraRounds() != null ? request.getMaxExtraRounds() : 1)
                        .tieBreakRule(request.getTieBreakRule() != null ? request.getTieBreakRule() : "WEIGHT")
                        .assessorCount(request.getAssessorCount() != null ? request.getAssessorCount() : 5)
                        .injuryTimeoutSeconds(request.getInjuryTimeoutSeconds() != null ? request.getInjuryTimeoutSeconds() : 60)
                        .build();
                
                VovinamSparringConfig savedSparringConfig = sparringConfigRepository.save(newSparringConfig);
                
                // Link weight classes
                if (request.getWeightClassIds() != null && !request.getWeightClassIds().isEmpty()) {
                    for (String weightClassId : request.getWeightClassIds()) {
                        WeightClass weightClass = weightClassRepository.findById(weightClassId)
                                .orElseThrow(() -> new BusinessException(
                                        String.format(MessageConstants.WEIGHT_CLASS_NOT_FOUND, weightClassId),
                                        ErrorCode.WEIGHT_CLASS_NOT_FOUND.getCode()
                                ));
                        
                        VovinamSparringConfigWeightClass weightClassLink = VovinamSparringConfigWeightClass.builder()
                                .vovinamSparringConfig(savedSparringConfig)
                                .weightClass(weightClass)
                                .build();
                        
                        sparringConfigWeightClassRepository.save(weightClassLink);
                    }
                }
            }
            
            // Handle music performance links update
            if (request.getMusicPerformanceIds() != null) {
                // Delete existing music performance links for this competition
                musicPerformanceRepository.deleteByCompetitionId(id);
                
                // Create new music performance links
                if (!request.getMusicPerformanceIds().isEmpty()) {
                    for (String musicPerformanceId : request.getMusicPerformanceIds()) {
                        MusicIntegratedPerformance musicPerformance = musicIntegratedPerformanceRepository.findById(musicPerformanceId)
                                .orElseThrow(() -> new BusinessException(
                                        String.format(MessageConstants.MUSIC_PERFORMANCE_NOT_FOUND, musicPerformanceId),
                                        ErrorCode.MUSIC_PERFORMANCE_NOT_FOUND.getCode()
                                ));
                        
                        CompetitionMusicIntegratedPerformance musicLink = new CompetitionMusicIntegratedPerformance();
                        musicLink.setCompetition(updatedCompetition);
                        musicLink.setMusicIntegratedPerformance(musicPerformance);
                        musicPerformanceRepository.save(musicLink);
                    }
                }
            }
            
            // Handle fist content selections update
            if (request.getFistConfigItemSelections() != null) {
                // Delete existing fist item selections for this competition
                fistItemSelectionRepository.deleteByCompetitionId(id);
                
                // Create new fist item selections
                if (!request.getFistConfigItemSelections().isEmpty()) {
                    for (var entry : request.getFistConfigItemSelections().entrySet()) {
                        String fistConfigId = entry.getKey();
                        List<String> selectedItemIds = entry.getValue();
                        
                        // Validate fist config exists
                        VovinamFistConfig fistConfig = fistConfigRepository.findById(fistConfigId)
                                .orElseThrow(() -> new BusinessException(
                                        String.format(MessageConstants.FIST_CONFIG_NOT_FOUND, fistConfigId),
                                        ErrorCode.FIST_CONFIG_NOT_FOUND.getCode()
                                ));
                        
                        // Create fist item selections
                        for (String itemId : selectedItemIds) {
                            VovinamFistItem fistItem = fistItemRepository.findById(itemId)
                                    .orElseThrow(() -> new BusinessException(
                                            String.format(MessageConstants.FIST_ITEM_NOT_FOUND, itemId),
                                            ErrorCode.FIST_ITEM_NOT_FOUND.getCode()
                                    ));
                            
                            // Validate that the item belongs to the config
                            if (!fistItem.getVovinamFistConfig().getId().equals(fistConfigId)) {
                                throw new BusinessException(
                                        String.format(MessageConstants.INVALID_FIST_ITEM_CONFIG, itemId, fistConfigId),
                                        ErrorCode.INVALID_FIST_ITEM_CONFIG.getCode()
                                );
                            }
                            
                            CompetitionFistItemSelection selection = new CompetitionFistItemSelection();
                            selection.setCompetition(updatedCompetition);
                            selection.setVovinamFistConfig(fistConfig);
                            selection.setVovinamFistItem(fistItem);
                            fistItemSelectionRepository.save(selection);
                        }
                    }
                }
            }
            
            log.info("Competition updated successfully with ID: {}", updatedCompetition.getId());
            return competitionMapper.toResponse(updatedCompetition);
            
        } catch (ResourceNotFoundException | BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating competition with id: {}", id, e);
            throw new BusinessException(MessageConstants.COMPETITION_UPDATE_ERROR, ErrorCode.COMPETITION_UPDATE_ERROR.getCode());
        }
    }
    
    @Override
    public void deleteCompetition(String id) {
        try {
            if (!competitionRepository.existsById(id)) {
                throw new ResourceNotFoundException(String.format(MessageConstants.COMPETITION_NOT_FOUND, id));
            }
            
            competitionRepository.deleteById(id);
            log.info("Competition deleted successfully with ID: {}", id);
            
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting competition with id: {}", id, e);
            throw new BusinessException(MessageConstants.COMPETITION_DELETE_ERROR, ErrorCode.COMPETITION_DELETE_ERROR.getCode());
        }
    }
    
    @Override
    public CompetitionResponse changeStatus(String id, TournamentStatus status) {
        try {
            Competition competition = competitionRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.COMPETITION_NOT_FOUND, id)));
            
            competition.setStatus(status);
            Competition updatedCompetition = competitionRepository.save(competition);
            
            log.info("Competition status changed to {} for ID: {}", status, updatedCompetition.getId());
            return competitionMapper.toResponse(updatedCompetition);
            
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error changing status for competition with id: {}", id, e);
            throw new BusinessException(MessageConstants.COMPETITION_STATUS_CHANGE_ERROR, ErrorCode.COMPETITION_STATUS_CHANGE_ERROR.getCode());
        }
    }
}

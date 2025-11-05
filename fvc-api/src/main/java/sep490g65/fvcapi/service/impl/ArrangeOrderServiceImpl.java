package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.RandomizeArrangeOrderRequest;
import sep490g65.fvcapi.dto.request.SaveArrangeOrderRequest;
import sep490g65.fvcapi.dto.response.ArrangeOrderResponse;
import sep490g65.fvcapi.dto.response.ContentItemResponse;
import sep490g65.fvcapi.entity.*;
import sep490g65.fvcapi.enums.ArrangeItemType;
import sep490g65.fvcapi.enums.ContentType;
import sep490g65.fvcapi.enums.ErrorCode;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.*;
import sep490g65.fvcapi.service.ArrangeOrderService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ArrangeOrderServiceImpl implements ArrangeOrderService {

    private final ArrangeSectionRepository arrangeSectionRepository;
    private final ArrangeItemRepository arrangeItemRepository;
    private final CompetitionRepository competitionRepository;
    private final AthleteRepository athleteRepository;
    private final CompetitionFistItemSelectionRepository fistItemSelectionRepository;
    private final CompetitionMusicIntegratedPerformanceRepository musicPerformanceRepository;
    private final VovinamFistItemRepository fistItemRepository;
    private final MusicIntegratedPerformanceRepository musicIntegratedPerformanceRepository;

    @Override
    public ArrangeOrderResponse getArrangeOrder(String competitionId, ContentType contentType) {
        log.info("Fetching arrange order for competition: {}, contentType: {}", competitionId, contentType);
        
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found with id: " + competitionId));
        
        // Fetch existing sections
        List<ArrangeSection> sections = arrangeSectionRepository
                .findByCompetitionIdAndContentType(competitionId, contentType);
        
        // Build sections response
        List<ArrangeOrderResponse.SectionDto> sectionsDto = sections.stream()
                .map(section -> {
                    List<ArrangeItem> items = arrangeItemRepository.findBySectionIdOrderByOrderIndex(section.getId());
                    String contentName = getContentName(section.getContentId(), contentType);
                    return ArrangeOrderResponse.SectionDto.builder()
                            .contentId(section.getContentId())
                            .contentName(contentName)
                            .items(items.stream()
                                    .map(item -> mapToItemDto(item, contentType))
                                    .collect(Collectors.toList()))
                            .build();
                })
                .collect(Collectors.toList());
        
        // Fetch pool (athletes not yet assigned)
        List<ArrangeOrderResponse.ArrangeItemDto> pool = getPool(competitionId, contentType, sections);
        
        return ArrangeOrderResponse.builder()
                .contentType(contentType)
                .competitionName(competition.getName())
                .sections(sectionsDto)
                .pool(pool)
                .build();
    }

    @Override
    public void saveArrangeOrder(SaveArrangeOrderRequest request) {
        log.info("Saving arrange order for competition: {}, contentType: {}", 
                request.getCompetitionId(), request.getContentType());
        
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found"));
        
        // Delete existing sections for this competition and content type
        arrangeSectionRepository.deleteByCompetitionIdAndContentType(
                request.getCompetitionId(), request.getContentType());
        
        // Create new sections and items
        for (SaveArrangeOrderRequest.SectionDto sectionDto : request.getSections()) {
            ArrangeSection section = new ArrangeSection();
            section.setCompetition(competition);
            section.setContentId(sectionDto.getContentId());
            section.setContentType(request.getContentType());
            section = arrangeSectionRepository.save(section);
            
            // Validate and create items
            validateItems(sectionDto.getItems(), request.getCompetitionId());
            
            int orderIndex = 1;
            for (SaveArrangeOrderRequest.ItemDto itemDto : sectionDto.getItems()) {
                ArrangeItem item = new ArrangeItem();
                item.setSection(section);
                item.setRefId(itemDto.getId());
                item.setRefType(itemDto.getType());
                item.setOrderIndex(orderIndex++);
                arrangeItemRepository.save(item);
            }
        }
        
        log.info("Arrange order saved successfully");
    }

    @Override
    public ArrangeOrderResponse randomizeFromRegistrations(RandomizeArrangeOrderRequest request) {
        log.info("Randomizing arrange order for competition: {}, contentType: {}", 
                request.getCompetitionId(), request.getContentType());
        
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new ResourceNotFoundException("Competition not found"));
        
        // Fetch athletes for this competition and content type
        Athlete.CompetitionType competitionType = request.getContentType() == ContentType.QUYEN 
                ? Athlete.CompetitionType.quyen 
                : Athlete.CompetitionType.music;
        
        List<Athlete> athletes = athleteRepository.findByCompetitionTypeAndCompetitionId(
                competitionType, request.getCompetitionId());
        
        // Apply filters
        List<Athlete> filtered = athletes.stream()
                .filter(a -> {
                    if (request.getGender() != null && !request.getGender().isEmpty()) {
                        if (!a.getGender().name().equalsIgnoreCase(request.getGender())) {
                            return false;
                        }
                    }
                    if (request.getContentType() == ContentType.QUYEN && request.getFormType() != null) {
                        if (!request.getFormType().equals(a.getSubCompetitionType())) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());
        
        // Group by contentId
        Map<String, List<Athlete>> groupedByContent = filtered.stream()
                .filter(a -> {
                    String contentId = request.getContentType() == ContentType.QUYEN 
                            ? a.getFistItemId() 
                            : a.getMusicContentId();
                    return contentId != null && !contentId.isEmpty();
                })
                .collect(Collectors.groupingBy(a -> 
                        request.getContentType() == ContentType.QUYEN 
                                ? a.getFistItemId() 
                                : a.getMusicContentId()));
        
        // Get content items to build sections
        List<ContentItemResponse> contentItems = getContentItems(request.getCompetitionId(), request.getContentType());
        Set<String> validContentIds = contentItems.stream()
                .map(ContentItemResponse::getId)
                .collect(Collectors.toSet());
        
        // Build sections
        List<ArrangeOrderResponse.SectionDto> sections = new ArrayList<>();
        for (ContentItemResponse contentItem : contentItems) {
            List<Athlete> sectionAthletes = groupedByContent.getOrDefault(contentItem.getId(), new ArrayList<>());
            
            // Shuffle if requested
            if (request.getRandomize()) {
                Collections.shuffle(sectionAthletes);
            }
            
            List<ArrangeOrderResponse.ArrangeItemDto> items = new ArrayList<>();
            for (int i = 0; i < sectionAthletes.size(); i++) {
                items.add(mapAthleteToItemDto(sectionAthletes.get(i), request.getContentType(), i + 1));
            }
            
            sections.add(ArrangeOrderResponse.SectionDto.builder()
                    .contentId(contentItem.getId())
                    .contentName(contentItem.getName())
                    .items(items)
                    .build());
        }
        
        // Build pool (athletes without valid contentId or not assigned to any section)
        Set<String> assignedIds = sections.stream()
                .flatMap(s -> s.getItems().stream())
                .map(ArrangeOrderResponse.ArrangeItemDto::getId)
                .collect(Collectors.toSet());
        
        List<ArrangeOrderResponse.ArrangeItemDto> pool = filtered.stream()
                .filter(a -> {
                    String contentId = request.getContentType() == ContentType.QUYEN 
                            ? a.getFistItemId() 
                            : a.getMusicContentId();
                    // Include in pool if: no contentId, invalid contentId, or not assigned
                    return contentId == null || contentId.isEmpty() 
                            || !validContentIds.contains(contentId)
                            || !assignedIds.contains(a.getId().toString());
                })
                .map(a -> mapAthleteToItemDto(a, request.getContentType(), null))
                .collect(Collectors.toList());
        
        return ArrangeOrderResponse.builder()
                .contentType(request.getContentType())
                .competitionName(competition.getName())
                .sections(sections)
                .pool(pool)
                .build();
    }

    @Override
    public List<ContentItemResponse> getContentItems(String competitionId, ContentType contentType) {
        log.info("Fetching content items for competition: {}, contentType: {}", competitionId, contentType);
        
        if (contentType == ContentType.QUYEN) {
            // Fetch fist items
            List<CompetitionFistItemSelection> selections = fistItemSelectionRepository
                    .findByCompetitionId(competitionId);
            return selections.stream()
                    .map(selection -> ContentItemResponse.builder()
                            .id(selection.getVovinamFistItem().getId())
                            .name(selection.getVovinamFistItem().getName())
                            .build())
                    .distinct()
                    .collect(Collectors.toList());
        } else {
            // Fetch music content
            List<CompetitionMusicIntegratedPerformance> selections = musicPerformanceRepository
                    .findByCompetitionId(competitionId);
            return selections.stream()
                    .map(selection -> ContentItemResponse.builder()
                            .id(selection.getMusicIntegratedPerformance().getId())
                            .name(selection.getMusicIntegratedPerformance().getName())
                            .build())
                    .collect(Collectors.toList());
        }
    }

    // Helper methods
    
    private List<ArrangeOrderResponse.ArrangeItemDto> getPool(String competitionId, ContentType contentType, 
                                                               List<ArrangeSection> sections) {
        Athlete.CompetitionType competitionType = contentType == ContentType.QUYEN 
                ? Athlete.CompetitionType.quyen 
                : Athlete.CompetitionType.music;
        
        List<Athlete> athletes = athleteRepository.findByCompetitionTypeAndCompetitionId(
                competitionType, competitionId);
        
        // Get assigned athlete IDs
        Set<String> assignedIds = sections.stream()
                .flatMap(s -> arrangeItemRepository.findBySectionIdOrderByOrderIndex(s.getId()).stream())
                .filter(item -> item.getRefType() == ArrangeItemType.ATHLETE)
                .map(ArrangeItem::getRefId)
                .collect(Collectors.toSet());
        
        return athletes.stream()
                .filter(a -> !assignedIds.contains(a.getId().toString()))
                .map(a -> mapAthleteToItemDto(a, contentType, null))
                .collect(Collectors.toList());
    }
    
    private ArrangeOrderResponse.ArrangeItemDto mapAthleteToItemDto(Athlete athlete, ContentType contentType, Integer orderIndex) {
        String contentId = contentType == ContentType.QUYEN 
                ? athlete.getFistItemId() 
                : athlete.getMusicContentId();
        
        return ArrangeOrderResponse.ArrangeItemDto.builder()
                .id(athlete.getId().toString())
                .type(ArrangeItemType.ATHLETE)
                .name(athlete.getFullName())
                .gender(athlete.getGender().name())
                .studentCode(athlete.getStudentId())
                .formType(contentType == ContentType.QUYEN ? athlete.getSubCompetitionType() : null)
                .contentId(contentId)
                .orderIndex(orderIndex)
                .members(null) // Teams not supported yet
                .build();
    }
    
    private ArrangeOrderResponse.ArrangeItemDto mapToItemDto(ArrangeItem item, ContentType contentType) {
        // For now, only support ATHLETE type
        if (item.getRefType() != ArrangeItemType.ATHLETE) {
            throw new BusinessException("Team type not yet supported", ErrorCode.BAD_REQUEST.getCode());
        }
        
        Athlete athlete = athleteRepository.findById(java.util.UUID.fromString(item.getRefId()))
                .orElseThrow(() -> new ResourceNotFoundException("Athlete not found: " + item.getRefId()));
        
        return mapAthleteToItemDto(athlete, contentType, item.getOrderIndex());
    }
    
    private String getContentName(String contentId, ContentType contentType) {
        if (contentType == ContentType.QUYEN) {
            return fistItemRepository.findById(contentId)
                    .map(VovinamFistItem::getName)
                    .orElse("Unknown");
        } else {
            return musicIntegratedPerformanceRepository.findById(contentId)
                    .map(MusicIntegratedPerformance::getName)
                    .orElse("Unknown");
        }
    }
    
    private void validateItems(List<SaveArrangeOrderRequest.ItemDto> items, String competitionId) {
        // Check for duplicates
        Set<String> seen = new HashSet<>();
        for (SaveArrangeOrderRequest.ItemDto item : items) {
            if (!seen.add(item.getId())) {
                throw new BusinessException("Duplicate item in section: " + item.getId(), 
                        ErrorCode.BAD_REQUEST.getCode());
            }
        }
        
        // Validate orderIndex continuity
        List<Integer> indices = items.stream()
                .map(SaveArrangeOrderRequest.ItemDto::getOrderIndex)
                .sorted()
                .collect(Collectors.toList());
        for (int i = 0; i < indices.size(); i++) {
            if (indices.get(i) != i + 1) {
                throw new BusinessException("Order index must be continuous starting from 1", 
                        ErrorCode.BAD_REQUEST.getCode());
            }
        }
    }
}


package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CreateCompetitionOrderRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateCompetitionOrderRequest;
import sep490g65.fvcapi.dto.response.CompetitionOrderResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.CompetitionFistItemSelection;
import sep490g65.fvcapi.entity.CompetitionOrder;
import sep490g65.fvcapi.enums.ErrorCode;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.CompetitionOrderRepository;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.repository.CompetitionFistItemSelectionRepository;
import sep490g65.fvcapi.service.CompetitionOrderService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CompetitionOrderServiceImpl implements CompetitionOrderService {

    private final CompetitionOrderRepository competitionOrderRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionFistItemSelectionRepository contentSelectionRepository;

    private CompetitionOrderResponse toDto(CompetitionOrder order) {
        return CompetitionOrderResponse.builder()
                .id(order.getId())
                .competitionId(order.getCompetition() != null ? order.getCompetition().getId() : null)
                .competitionName(order.getCompetition() != null ? order.getCompetition().getName() : null)
                .orderIndex(order.getOrderIndex())
                .contentSelectionId(order.getContentSelection() != null ? order.getContentSelection().getId() : null)
                .athleteCount(0)
                .athleteIds(java.util.List.of())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public PaginationResponse<CompetitionOrderResponse> list(RequestParam params) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        
        Page<CompetitionOrder> page = competitionOrderRepository.findAll(pageable);
        Page<CompetitionOrderResponse> mapped = page.map(this::toDto);
        
        return ResponseUtils.createPaginatedResponse(mapped);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CompetitionOrderResponse> findByCompetitionId(String competitionId) {
        List<CompetitionOrder> orders = competitionOrderRepository
                .findByCompetition_IdOrderByOrderIndexAsc(competitionId);
        
        return orders.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public CompetitionOrderResponse getById(String id) {
        CompetitionOrder order = competitionOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.COMPETITION_ORDER_NOT_FOUND, id)));
        
        return toDto(order);
    }

    @Override
    public CompetitionOrder create(CreateCompetitionOrderRequest request) {
        // Validate competition exists
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.COMPETITION_NOT_FOUND, request.getCompetitionId())));

        // Validate content selection if provided
        CompetitionFistItemSelection contentSelection = null;
        if (request.getContentSelectionId() != null) {
            contentSelection = contentSelectionRepository.findById(request.getContentSelectionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            String.format(MessageConstants.CONTENT_SELECTION_NOT_FOUND, 
                                    request.getContentSelectionId())));
        }

        // Check for duplicate order index in the same competition
        if (competitionOrderRepository.existsByCompetition_IdAndOrderIndex(
                request.getCompetitionId(), request.getOrderIndex())) {
            throw new BusinessException(
                    String.format(MessageConstants.COMPETITION_ORDER_DUPLICATE_INDEX,
                            request.getOrderIndex(), request.getCompetitionId()),
                    ErrorCode.OPERATION_FAILED.getCode());
        }

        // Create new competition order
        CompetitionOrder order = new CompetitionOrder();
        order.setCompetition(competition);
        order.setOrderIndex(request.getOrderIndex());
        order.setContentSelection(contentSelection);

        CompetitionOrder saved = competitionOrderRepository.save(order);
        return saved;
    }

    @Override
    public List<CompetitionOrder> createBulk(List<CreateCompetitionOrderRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        // Validate all competitions exist
        List<String> competitionIds = requests.stream()
                .map(CreateCompetitionOrderRequest::getCompetitionId)
                .distinct()
                .collect(Collectors.toList());
        
        List<Competition> competitions = competitionRepository.findAllById(competitionIds);
        if (competitions.size() != competitionIds.size()) {
            throw new BusinessException("One or more competitions not found", ErrorCode.OPERATION_FAILED.getCode());
        }

        // Validate all content selections exist if provided
        List<String> contentSelectionIds = requests.stream()
                .map(CreateCompetitionOrderRequest::getContentSelectionId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
        if (!contentSelectionIds.isEmpty()) {
            List<CompetitionFistItemSelection> contentSelections = contentSelectionRepository.findAllById(contentSelectionIds);
            if (contentSelections.size() != contentSelectionIds.size()) {
                throw new BusinessException("One or more content selections not found", ErrorCode.OPERATION_FAILED.getCode());
            }
        }

        // Check for duplicate order indices within the same competition
        Map<String, List<CreateCompetitionOrderRequest>> requestsByCompetition = requests.stream()
                .collect(Collectors.groupingBy(CreateCompetitionOrderRequest::getCompetitionId));
        
        for (Map.Entry<String, List<CreateCompetitionOrderRequest>> entry : requestsByCompetition.entrySet()) {
            List<Integer> orderIndices = entry.getValue().stream()
                    .map(CreateCompetitionOrderRequest::getOrderIndex)
                    .collect(Collectors.toList());
            
            Set<Integer> uniqueIndices = new HashSet<>(orderIndices);
            if (uniqueIndices.size() != orderIndices.size()) {
                throw new BusinessException(
                        String.format("Duplicate order indices found for competition %s", entry.getKey()),
                        ErrorCode.OPERATION_FAILED.getCode());
            }
        }

        // Create competition orders
        List<CompetitionOrder> orders = new ArrayList<>();
        Map<String, Competition> competitionMap = competitions.stream()
                .collect(Collectors.toMap(Competition::getId, c -> c));
        
        Map<String, CompetitionFistItemSelection> contentSelectionMap = contentSelectionIds.isEmpty() 
                ? Map.of() 
                : contentSelectionRepository.findAllById(contentSelectionIds).stream()
                        .collect(Collectors.toMap(CompetitionFistItemSelection::getId, cs -> cs));

        for (CreateCompetitionOrderRequest request : requests) {
            CompetitionOrder order = new CompetitionOrder();
            order.setCompetition(competitionMap.get(request.getCompetitionId()));
            order.setOrderIndex(request.getOrderIndex());
            
            if (request.getContentSelectionId() != null) {
                order.setContentSelection(contentSelectionMap.get(request.getContentSelectionId()));
            }
            
            orders.add(order);
        }

        return competitionOrderRepository.saveAll(orders);
    }

    @Override
    public CompetitionOrderResponse update(String id, UpdateCompetitionOrderRequest request) {
        CompetitionOrder order = competitionOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format(MessageConstants.COMPETITION_ORDER_NOT_FOUND, id)));

        // Update order index if provided
        if (request.getOrderIndex() != null && !request.getOrderIndex().equals(order.getOrderIndex())) {
            // Check for duplicate order index
            if (competitionOrderRepository.existsByCompetition_IdAndOrderIndex(
                    order.getCompetition().getId(), request.getOrderIndex())) {
                throw new BusinessException(
                        String.format(MessageConstants.COMPETITION_ORDER_DUPLICATE_INDEX,
                                request.getOrderIndex(), order.getCompetition().getId()),
                        ErrorCode.OPERATION_FAILED.getCode());
            }
            order.setOrderIndex(request.getOrderIndex());
        }

        // Update content selection if provided
        if (request.getContentSelectionId() != null) {
            CompetitionFistItemSelection contentSelection = contentSelectionRepository
                    .findById(request.getContentSelectionId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            String.format(MessageConstants.CONTENT_SELECTION_NOT_FOUND, 
                                    request.getContentSelectionId())));
            order.setContentSelection(contentSelection);
        }

        CompetitionOrder updated = competitionOrderRepository.save(order);
        return toDto(updated);
    }

    @Override
    public void delete(String id) {
        if (!competitionOrderRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    String.format(MessageConstants.COMPETITION_ORDER_NOT_FOUND, id));
        }
        
        competitionOrderRepository.deleteById(id);
    }

    @Override
    public void deleteByCompetitionId(String competitionId) {
        // Validate competition exists
        if (!competitionRepository.existsById(competitionId)) {
            throw new ResourceNotFoundException(
                    String.format(MessageConstants.COMPETITION_NOT_FOUND, competitionId));
        }
        
        competitionOrderRepository.deleteByCompetitionId(competitionId);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CompetitionOrderResponse> findByCompetitionIdAndContentSelectionId(
            String competitionId, 
            String contentSelectionId) {
        
        List<CompetitionOrder> orders = competitionOrderRepository
                .findByCompetition_IdAndContentSelection_IdOrderByOrderIndexAsc(
                        competitionId, contentSelectionId);
        
        return orders.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}

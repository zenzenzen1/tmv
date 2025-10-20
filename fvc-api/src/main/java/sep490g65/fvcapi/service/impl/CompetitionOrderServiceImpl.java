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

import java.util.List;
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
                .athleteCount(order.getAthletes() != null ? order.getAthletes().size() : 0)
                .athleteIds(order.getAthletes() != null 
                        ? order.getAthletes().stream()
                                .map(athlete -> athlete.getId().toString())
                                .collect(Collectors.toList())
                        : List.of())
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

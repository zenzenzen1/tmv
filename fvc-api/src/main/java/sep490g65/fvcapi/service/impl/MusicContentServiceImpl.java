package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CreateMusicContentRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateMusicContentRequest;
import sep490g65.fvcapi.dto.response.MusicContentResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.MusicIntegratedPerformance;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.MusicIntegratedPerformanceRepository;
import sep490g65.fvcapi.service.MusicContentService;
import sep490g65.fvcapi.utils.ResponseUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class MusicContentServiceImpl implements MusicContentService {

    private final MusicIntegratedPerformanceRepository repository;

    private MusicContentResponse toDto(MusicIntegratedPerformance e) {
        return MusicContentResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .description(e.getDescription())
                .isActive(Boolean.TRUE.equals(e.getIsActive()))
                .performersPerEntry(e.getPerformersPerEntry())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<MusicContentResponse> list(RequestParam params) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        String keyword = params.hasSearch() ? ("%" + params.getSearchTerm().toLowerCase() + "%") : null;
        Boolean active = null;
        if (params.hasStatus()) {
            active = "ACTIVE".equalsIgnoreCase(params.getStatus()) || "true".equalsIgnoreCase(params.getStatus());
        }
        Page<MusicIntegratedPerformance> page = repository.search(keyword, active, pageable);
        return ResponseUtils.createPaginatedResponse(page.map(this::toDto));
    }

    @Override
    public MusicContentResponse getById(String id) {
        MusicIntegratedPerformance e = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.USER_NOT_FOUND, id)));
        return toDto(e);
    }

    @Override
    public MusicContentResponse create(CreateMusicContentRequest request) {
        // Validate duplicate name (case-insensitive)
        if (repository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Music content with this name already exists", "DUPLICATE_NAME");
        }

        MusicIntegratedPerformance e = MusicIntegratedPerformance.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
                .performersPerEntry(request.getPerformersPerEntry() != null ? request.getPerformersPerEntry() : 1)
                .build();
        return toDto(repository.save(e));
    }

    @Override
    public MusicContentResponse update(String id, UpdateMusicContentRequest request) {
        MusicIntegratedPerformance e = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Music content not found: " + id));
        if (request.getName() != null) e.setName(request.getName());
        if (request.getDescription() != null) e.setDescription(request.getDescription());
        if (request.getIsActive() != null) e.setIsActive(request.getIsActive());
        if (request.getPerformersPerEntry() != null) e.setPerformersPerEntry(request.getPerformersPerEntry());
        return toDto(repository.save(e));
    }

    @Override
    public void delete(String id) {
        MusicIntegratedPerformance e = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Music content not found: " + id));
        repository.delete(e);
    }
}



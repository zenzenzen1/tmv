package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import sep490g65.fvcapi.dto.request.CreateFistConfigRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.CreateFistItemRequest;
import sep490g65.fvcapi.dto.request.UpdateFistItemRequest;
import sep490g65.fvcapi.dto.request.UpdateFistConfigRequest;
import sep490g65.fvcapi.dto.response.FistConfigResponse;
import sep490g65.fvcapi.dto.response.FistItemResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.VovinamFistConfig;
import sep490g65.fvcapi.entity.VovinamFistItem;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.VovinamFistConfigRepository;
import sep490g65.fvcapi.repository.VovinamFistItemRepository;
import sep490g65.fvcapi.service.VovinamFistConfigService;

@Service
@RequiredArgsConstructor
public class VovinamFistConfigServiceImpl implements VovinamFistConfigService {

    private final VovinamFistConfigRepository repository;
    private final VovinamFistItemRepository fistItemRepository;

    private FistConfigResponse toDto(VovinamFistConfig v) {
        return FistConfigResponse.builder()
                .id(v.getId())
                .name(v.getName())
                .description(v.getDescription())
                .status(v.getStatus())
                .build();
    }

    @Override
    public PaginationResponse<FistConfigResponse> list(RequestParam params) {
        Sort sort = Sort.by(params.getSortBy());
        sort = params.isAscending() ? sort.ascending() : sort.descending();
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);

        Boolean status = null;
        if (params.hasStatus()) {
            status = Boolean.valueOf(params.getStatus());
        }

        String searchPattern = null;
        if (params.hasSearch()) {
            searchPattern = "%" + params.getSearchTerm().toLowerCase() + "%";
        }
        Page<VovinamFistConfig> page = repository.search(searchPattern, status, pageable);
        Page<FistConfigResponse> mapped = page.map(this::toDto);
        return PaginationResponse.<FistConfigResponse>builder()
                .content(mapped.getContent())
                .page(mapped.getNumber())
                .size(mapped.getSize())
                .totalElements(mapped.getTotalElements())
                .totalPages(mapped.getTotalPages())
                .first(mapped.isFirst())
                .last(mapped.isLast())
                .hasNext(mapped.hasNext())
                .hasPrevious(mapped.hasPrevious())
                .build();
    }

    @Override
    public FistConfigResponse getById(String id) {
        VovinamFistConfig v = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FistConfig not found: " + id));
        return toDto(v);
    }

    @Override
    public FistConfigResponse create(CreateFistConfigRequest request) {
        VovinamFistConfig v = VovinamFistConfig.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : Boolean.TRUE)
                .build();
        VovinamFistConfig saved = repository.save(v);
        return toDto(saved);
    }

    @Override
    public FistConfigResponse update(String id, UpdateFistConfigRequest request) {
        VovinamFistConfig v = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FistConfig not found: " + id));
        if (request.getName() != null) v.setName(request.getName());
        if (request.getDescription() != null) v.setDescription(request.getDescription());
        if (request.getStatus() != null) v.setStatus(request.getStatus());
        VovinamFistConfig saved = repository.save(v);
        return toDto(saved);
    }
    @Override
    public void delete(String id) {
        VovinamFistConfig v = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FistConfig not found: " + id));
        repository.delete(v);
    }

    // FistItem methods
    @Override
    public PaginationResponse<FistItemResponse> listItems(RequestParam params) {
        Sort sort = Sort.by(params.getSortBy());
        sort = params.isAscending() ? sort.ascending() : sort.descending();
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);

        Page<VovinamFistItem> page = fistItemRepository.findAll(pageable);
        Page<FistItemResponse> mapped = page.map(this::mapItemToResponse);
        
        return PaginationResponse.<FistItemResponse>builder()
                .content(mapped.getContent())
                .page(mapped.getNumber())
                .size(mapped.getSize())
                .totalElements(mapped.getTotalElements())
                .totalPages(mapped.getTotalPages())
                .first(mapped.isFirst())
                .last(mapped.isLast())
                .hasNext(mapped.hasNext())
                .hasPrevious(mapped.hasPrevious())
                .build();
    }

    @Override
    public FistItemResponse getItemById(String id) {
        VovinamFistItem item = fistItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FistItem not found: " + id));
        return mapItemToResponse(item);
    }

    @Override
    public PaginationResponse<FistItemResponse> getItemsByConfigId(String configId) {
        // Verify config exists
        repository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("FistConfig not found: " + configId));
                
        List<VovinamFistItem> items = fistItemRepository.findByVovinamFistConfigId(configId);
        List<FistItemResponse> content = items.stream()
                .map(this::mapItemToResponse)
                .toList();
                
        return PaginationResponse.<FistItemResponse>builder()
                .content(content)
                .page(0)
                .size(content.size())
                .totalElements(content.size())
                .totalPages(1)
                .first(true)
                .last(true)
                .hasNext(false)
                .hasPrevious(false)
                .build();
    }

    private FistItemResponse mapItemToResponse(VovinamFistItem item) {
        return FistItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .level(item.getLevel())
                .participantsPerEntry(item.getParticipantsPerEntry())
                .configId(item.getVovinamFistConfig() != null ? item.getVovinamFistConfig().getId() : null)
                .configName(item.getVovinamFistConfig() != null ? item.getVovinamFistConfig().getName() : null)
                .build();
    }

    @Override
    public FistItemResponse createItem(String configId, CreateFistItemRequest request) {
        VovinamFistConfig config = repository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("FistConfig not found: " + configId));

        VovinamFistItem parent = null;
        if (request.getParentId() != null) {
            parent = fistItemRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("FistItem not found: " + request.getParentId()));
        }

        VovinamFistItem entity = VovinamFistItem.builder()
                .vovinamFistConfig(config)
                .parent(parent)
                .name(request.getName())
                .description(request.getDescription())
                .participantsPerEntry(request.getParticipantsPerEntry() != null ? request.getParticipantsPerEntry() : 1)
                .level(parent == null ? 1 : (parent.getLevel() == null ? 2 : parent.getLevel() + 1))
                .build();
        VovinamFistItem saved = fistItemRepository.save(entity);
        return mapItemToResponse(saved);
    }

    @Override
    public FistItemResponse updateItem(String configId, String itemId, UpdateFistItemRequest request) {
        // validate config
        repository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("FistConfig not found: " + configId));

        VovinamFistItem entity = fistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("FistItem not found: " + itemId));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getParticipantsPerEntry() != null) entity.setParticipantsPerEntry(request.getParticipantsPerEntry());
        if (request.getParentId() != null) {
            VovinamFistItem parent = fistItemRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("FistItem not found: " + request.getParentId()));
            entity.setParent(parent);
        }
        VovinamFistItem saved = fistItemRepository.save(entity);
        return mapItemToResponse(saved);
    }

    @Override
    public void deleteItem(String configId, String itemId) {
        // validate config
        repository.findById(configId)
                .orElseThrow(() -> new ResourceNotFoundException("FistConfig not found: " + configId));
        VovinamFistItem entity = fistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("FistItem not found: " + itemId));
        fistItemRepository.delete(entity);
    }
}



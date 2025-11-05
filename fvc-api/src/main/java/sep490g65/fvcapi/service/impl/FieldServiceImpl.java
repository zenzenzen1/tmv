package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreateFieldRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateFieldRequest;
import sep490g65.fvcapi.dto.response.FieldResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.Field;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.FieldRepository;
import sep490g65.fvcapi.service.FieldService;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.utils.ResponseUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class FieldServiceImpl implements FieldService {

    private final FieldRepository fieldRepository;

    private FieldResponse toDto(Field field) {
        return FieldResponse.builder()
                .id(field.getId())
                .location(field.getLocation())
                .isUsed(field.getIsUsed())
                .createdAt(field.getCreatedAt())
                .updatedAt(field.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public PaginationResponse<FieldResponse> list(RequestParam params) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        String keyword = params.hasSearch() ? ("%" + params.getSearchTerm().toLowerCase() + "%") : null;
        Page<Field> page = fieldRepository.search(keyword, null, pageable);
        Page<FieldResponse> mapped = page.map(this::toDto);
        return ResponseUtils.createPaginatedResponse(mapped);
    }

    @Override
    public FieldResponse getById(String id) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.FIELD_NOT_FOUND, id)));
        return toDto(field);
    }

    @Override
    public FieldResponse create(CreateFieldRequest request) {
        Field field = Field.builder()
                .location(request.getLocation())
                .isUsed(request.getIsUsed() != null ? request.getIsUsed() : false)
                .build();
        Field saved = fieldRepository.save(field);
        return toDto(saved);
    }

    @Override
    public FieldResponse update(String id, UpdateFieldRequest request) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.FIELD_NOT_FOUND, id)));
        
        if (request.getLocation() != null) {
            field.setLocation(request.getLocation());
        }
        if (request.getIsUsed() != null) {
            field.setIsUsed(request.getIsUsed());
        }
        
        Field updated = fieldRepository.save(field);
        return toDto(updated);
    }

    @Override
    public void delete(String id) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.FIELD_NOT_FOUND, id)));
        fieldRepository.delete(field);
    }
}


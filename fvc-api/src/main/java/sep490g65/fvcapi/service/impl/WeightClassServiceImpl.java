package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.enums.ErrorCode;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.WeightClass;
import sep490g65.fvcapi.enums.Gender;
import sep490g65.fvcapi.enums.WeightClassStatus;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.WeightClassRepository;
import sep490g65.fvcapi.service.WeightClassService;
import sep490g65.fvcapi.dto.request.CreateWeightClassRequest;
import sep490g65.fvcapi.dto.request.UpdateWeightClassRequest;
import sep490g65.fvcapi.dto.response.WeightClassResponse;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional
public class WeightClassServiceImpl implements WeightClassService {

    private final WeightClassRepository weightClassRepository;

    private void validateRange(BigDecimal min, BigDecimal max) {
        if (min != null && max != null && min.compareTo(max) >= 0) {
            throw new BusinessException(MessageConstants.WEIGHT_CLASS_RANGE_INVALID, ErrorCode.VALIDATION_ERROR.getCode());
        }
    }

    private void ensureNoOverlapActive(Gender gender, BigDecimal min, BigDecimal max, String excludeId) {
        if (gender != null && min != null && max != null) {
            if (weightClassRepository.existsActiveOverlap(gender, min, max, excludeId)) {
                throw new BusinessException(MessageConstants.WEIGHT_CLASS_OVERLAP_CONFLICT, ErrorCode.OPERATION_FAILED.getCode());
            }
        }
    }

    private WeightClassResponse toDto(WeightClass w) {
        return WeightClassResponse.builder()
                .id(w.getId())
                .gender(w.getGender())
                .minWeight(w.getMinWeight())
                .maxWeight(w.getMaxWeight())
                .note(w.getNote())
                .status(w.getStatus())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public PaginationResponse<WeightClassResponse> list(RequestParam params) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        String keyword = params.hasSearch() ? ("%" + params.getSearchTerm().toLowerCase() + "%") : null;
        Page<WeightClass> page = weightClassRepository.search(
                keyword,
                null,
                null,
                pageable
        );
        Page<WeightClassResponse> mapped = page.map(this::toDto);
        return ResponseUtils.createPaginatedResponse(mapped);
    }

    @Override
    public WeightClassResponse getById(String id) {
        WeightClass w = weightClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.WEIGHT_CLASS_NOT_FOUND, id)));
        return toDto(w);
    }

    @Override
    public WeightClassResponse create(CreateWeightClassRequest request) {
        validateRange(request.getMinWeight(), request.getMaxWeight());
        ensureNoOverlapActive(request.getGender(), request.getMinWeight(), request.getMaxWeight(), null);

        WeightClass w = WeightClass.builder()
                .gender(request.getGender())
                .minWeight(request.getMinWeight())
                .maxWeight(request.getMaxWeight())
                .note(request.getNote())
                .status(request.getSaveMode() != null ? request.getSaveMode() : WeightClassStatus.DRAFT)
                .build();
        WeightClass saved = weightClassRepository.save(w);
        return toDto(saved);
    }

    @Override
    public WeightClassResponse update(String id, UpdateWeightClassRequest request) {
        WeightClass w = weightClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WeightClass not found: " + id));

        if (w.getStatus() == WeightClassStatus.LOCKED) {
            throw new BusinessException(MessageConstants.WEIGHT_CLASS_LOCKED_EDIT, ErrorCode.OPERATION_FAILED.getCode());
        }

        BigDecimal newMin = request.getMinWeight() != null ? request.getMinWeight() : w.getMinWeight();
        BigDecimal newMax = request.getMaxWeight() != null ? request.getMaxWeight() : w.getMaxWeight();
        validateRange(newMin, newMax);
        ensureNoOverlapActive(w.getGender(), newMin, newMax, w.getId());

        w.setMinWeight(newMin);
        w.setMaxWeight(newMax);
        if (request.getNote() != null) w.setNote(request.getNote());

        return toDto(weightClassRepository.save(w));
    }

    @Override
    public void changeStatus(String id, WeightClassStatus status) {
        WeightClass w = weightClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.WEIGHT_CLASS_NOT_FOUND, id)));

        if (w.getStatus() == WeightClassStatus.LOCKED && status != WeightClassStatus.LOCKED) {
            throw new BusinessException(MessageConstants.WEIGHT_CLASS_CANNOT_UNLOCK, ErrorCode.OPERATION_FAILED.getCode());
        }

        if (status == WeightClassStatus.ACTIVE) {
            ensureNoOverlapActive(w.getGender(), w.getMinWeight(), w.getMaxWeight(), w.getId());
        }

        w.setStatus(status);
        weightClassRepository.save(w);
    }

    @Override
    public void delete(String id) {
        WeightClass w = weightClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(String.format(MessageConstants.WEIGHT_CLASS_NOT_FOUND, id)));
        if (w.getStatus() != WeightClassStatus.DRAFT) {
            throw new BusinessException(MessageConstants.WEIGHT_CLASS_DELETE_ONLY_DRAFT, ErrorCode.OPERATION_FAILED.getCode());
        }
        // TODO: ensure not referenced by any config (requires join repo); skipping for now
        weightClassRepository.delete(w);
    }
}



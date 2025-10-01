package sep490g65.fvcapi.service;

import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.WeightClassResponse;
import sep490g65.fvcapi.enums.WeightClassStatus;
import sep490g65.fvcapi.dto.request.CreateWeightClassRequest;
import sep490g65.fvcapi.dto.request.UpdateWeightClassRequest;

public interface WeightClassService {

    @Transactional(readOnly = true)
    PaginationResponse<WeightClassResponse> list(RequestParam params);

    WeightClassResponse getById(String id);
    WeightClassResponse create(CreateWeightClassRequest request);
    WeightClassResponse update(String id, UpdateWeightClassRequest request);
    void changeStatus(String id, WeightClassStatus status);
    void delete(String id);
}



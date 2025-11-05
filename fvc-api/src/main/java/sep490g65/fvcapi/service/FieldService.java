package sep490g65.fvcapi.service;

import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreateFieldRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateFieldRequest;
import sep490g65.fvcapi.dto.response.FieldResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;

public interface FieldService {

    @Transactional(readOnly = true)
    PaginationResponse<FieldResponse> list(RequestParam params);

    FieldResponse getById(String id);
    
    FieldResponse create(CreateFieldRequest request);
    
    FieldResponse update(String id, UpdateFieldRequest request);
    
    void delete(String id);
}


package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.CreateFistConfigRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateFistConfigRequest;
import sep490g65.fvcapi.dto.response.FistConfigResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;

public interface VovinamFistConfigService {
    PaginationResponse<FistConfigResponse> list(RequestParam params);
    FistConfigResponse getById(String id);
    FistConfigResponse create(CreateFistConfigRequest request);
    FistConfigResponse update(String id, UpdateFistConfigRequest request);
}



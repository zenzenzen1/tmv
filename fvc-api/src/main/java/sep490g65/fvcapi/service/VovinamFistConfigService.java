package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.CreateFistConfigRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateFistConfigRequest;
import sep490g65.fvcapi.dto.request.CreateFistItemRequest;
import sep490g65.fvcapi.dto.request.UpdateFistItemRequest;
import sep490g65.fvcapi.dto.response.FistConfigResponse;
import sep490g65.fvcapi.dto.response.FistItemResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;

public interface VovinamFistConfigService {
    PaginationResponse<FistConfigResponse> list(RequestParam params);
    FistConfigResponse getById(String id);
    FistConfigResponse create(CreateFistConfigRequest request);
    FistConfigResponse update(String id, UpdateFistConfigRequest request);
    void delete(String id);
    // FistItem methods
    PaginationResponse<FistItemResponse> listItems(RequestParam params);
    FistItemResponse getItemById(String id);
    PaginationResponse<FistItemResponse> getItemsByConfigId(String configId);
    FistItemResponse createItem(String configId, CreateFistItemRequest request);
    FistItemResponse updateItem(String configId, String itemId, UpdateFistItemRequest request);
    void deleteItem(String configId, String itemId);
}



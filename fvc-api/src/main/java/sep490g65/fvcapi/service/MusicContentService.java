package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.CreateMusicContentRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateMusicContentRequest;
import sep490g65.fvcapi.dto.response.MusicContentResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;

public interface MusicContentService {
    PaginationResponse<MusicContentResponse> list(RequestParam params);
    MusicContentResponse getById(String id);
    MusicContentResponse create(CreateMusicContentRequest request);
    MusicContentResponse update(String id, UpdateMusicContentRequest request);
    void delete(String id);
}



package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CreateMusicContentRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateMusicContentRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.MusicContentResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.service.MusicContentService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.MUSIC_CONTENTS_PATH)
@RequiredArgsConstructor
public class MusicContentController {

    private final MusicContentService service;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<MusicContentResponse>>> list(@Valid @ModelAttribute RequestParam params) {
        PaginationResponse<MusicContentResponse> data = service.list(params);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.MUSIC_CONTENTS_RETRIEVED, data));
    }

    @GetMapping(ApiConstants.MUSIC_CONTENT_ID_PATH)
    public ResponseEntity<BaseResponse<MusicContentResponse>> get(@PathVariable String id) {
        MusicContentResponse data = service.getById(id);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.MUSIC_CONTENT_RETRIEVED, data));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<MusicContentResponse>> create(@Valid @RequestBody CreateMusicContentRequest request) {
        MusicContentResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseUtils.success(MessageConstants.MUSIC_CONTENT_CREATED, created));
    }

    @PutMapping(ApiConstants.MUSIC_CONTENT_ID_PATH)
    public ResponseEntity<BaseResponse<MusicContentResponse>> update(@PathVariable String id, @Valid @RequestBody UpdateMusicContentRequest request) {
        MusicContentResponse updated = service.update(id, request);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.MUSIC_CONTENT_UPDATED, updated));
    }

    @DeleteMapping(ApiConstants.MUSIC_CONTENT_ID_PATH)
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.MUSIC_CONTENT_DELETED));
    }
}



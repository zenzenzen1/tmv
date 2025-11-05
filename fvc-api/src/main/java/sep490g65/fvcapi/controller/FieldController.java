package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CreateFieldRequest;
import sep490g65.fvcapi.dto.request.UpdateFieldRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.FieldResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.service.FieldService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.FIELDS_PATH)
@RequiredArgsConstructor
@Slf4j
public class FieldController {

    private final FieldService fieldService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<FieldResponse>>> list(@Valid @ModelAttribute sep490g65.fvcapi.dto.request.RequestParam params) {
        PaginationResponse<FieldResponse> data = fieldService.list(params);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.FIELDS_RETRIEVED, data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<FieldResponse>> get(@PathVariable String id) {
        FieldResponse data = fieldService.getById(id);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.FIELD_RETRIEVED, data));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<FieldResponse>> create(@Valid @RequestBody CreateFieldRequest request) {
        FieldResponse created = fieldService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success(MessageConstants.FIELD_CREATED, created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<FieldResponse>> update(@PathVariable String id,
                                                               @Valid @RequestBody UpdateFieldRequest request) {
        FieldResponse updated = fieldService.update(id, request);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.FIELD_UPDATED, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable String id) {
        fieldService.delete(id);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.FIELD_DELETED));
    }
}


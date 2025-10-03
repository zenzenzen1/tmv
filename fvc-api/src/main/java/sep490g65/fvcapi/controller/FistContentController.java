package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.request.CreateFistConfigRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateFistConfigRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.FistConfigResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.service.VovinamFistConfigService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/fist-configs")
@RequiredArgsConstructor
public class FistContentController {

    private final VovinamFistConfigService service;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<FistConfigResponse>>> list(@Valid @ModelAttribute RequestParam params) {
        PaginationResponse<FistConfigResponse> data = service.list(params);
        return ResponseEntity.ok(ResponseUtils.success("Fist contents retrieved", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<FistConfigResponse>> get(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Fist content retrieved", service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<FistConfigResponse>> create(@Valid @RequestBody CreateFistConfigRequest request) {
        FistConfigResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseUtils.success("Fist content created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<FistConfigResponse>> update(@PathVariable String id,
                                                                   @Valid @RequestBody UpdateFistConfigRequest request) {
        return ResponseEntity.ok(ResponseUtils.success("Fist content updated", service.update(id, request)));
    }
}



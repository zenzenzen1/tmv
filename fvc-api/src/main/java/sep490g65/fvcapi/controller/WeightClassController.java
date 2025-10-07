package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.enums.WeightClassStatus;
import sep490g65.fvcapi.service.WeightClassService;
import sep490g65.fvcapi.dto.request.CreateWeightClassRequest;
import sep490g65.fvcapi.dto.request.UpdateWeightClassRequest;
import sep490g65.fvcapi.dto.response.WeightClassResponse;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.WEIGHT_CLASSES_PATH)
@RequiredArgsConstructor
@Slf4j
public class WeightClassController {

    private final WeightClassService weightClassService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<WeightClassResponse>>> list(@Valid @ModelAttribute sep490g65.fvcapi.dto.request.RequestParam params) {
        PaginationResponse<WeightClassResponse> data = weightClassService.list(params);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.WEIGHT_CLASSES_RETRIEVED, data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<WeightClassResponse>> get(@PathVariable String id) {
        WeightClassResponse data = weightClassService.getById(id);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.WEIGHT_CLASS_RETRIEVED, data));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<WeightClassResponse>> create(@Valid @RequestBody CreateWeightClassRequest request) {
        WeightClassResponse created = weightClassService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success(MessageConstants.WEIGHT_CLASS_CREATED, created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<WeightClassResponse>> update(@PathVariable String id,
                                                                    @Valid @RequestBody UpdateWeightClassRequest request) {
        WeightClassResponse updated = weightClassService.update(id, request);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.WEIGHT_CLASS_UPDATED, updated));
    }

    @PatchMapping(ApiConstants.WEIGHT_CLASS_STATUS_PATH)
    public ResponseEntity<BaseResponse<Void>> changeStatus(@PathVariable String id,
                                                           @RequestParam("status") WeightClassStatus status) {
        weightClassService.changeStatus(id, status);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.WEIGHT_CLASS_STATUS_UPDATED));
    }

    @DeleteMapping(ApiConstants.WEIGHT_CLASS_ID_PATH)
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable String id) {
        weightClassService.delete(id);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.WEIGHT_CLASS_DELETED));
    }
}



package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.BulkUpdateStatusRequest;
// use fully qualified name in method signature to avoid naming conflict
import sep490g65.fvcapi.dto.request.SubmitApplicationFormRequest;
import sep490g65.fvcapi.dto.request.UpdateSubmissionStatusRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.SubmittedApplicationFormResponse;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.service.SubmittedApplicationFormService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/submitted-forms")
@RequiredArgsConstructor
public class SubmittedApplicationFormController {

    private final SubmittedApplicationFormService service;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<SubmittedApplicationFormResponse>>> list(
            @Valid @ModelAttribute sep490g65.fvcapi.dto.request.RequestParam params,
            @RequestParam(value = "type", required = false) ApplicationFormType type
    ) {
        PaginationResponse<SubmittedApplicationFormResponse> data = service.list(params, type);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }
    
    @PostMapping
    public ResponseEntity<BaseResponse<SubmittedApplicationFormResponse>> submit(
            @Valid @RequestBody SubmitApplicationFormRequest request
    ) {
        try {
            // Submit the form (this would need to be implemented in the service)
            SubmittedApplicationFormResponse response = service.submit(request);
            return ResponseEntity.ok(ResponseUtils.success("Form submitted successfully", response));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return ResponseEntity.badRequest()
                    .body(ResponseUtils.error("Invalid JSON format in form data", "JSON_PROCESSING_ERROR"));
        }
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<BaseResponse<Void>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSubmissionStatusRequest request
    ) {
        service.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS));
    }
    
    @PatchMapping("/bulk-status")
    public ResponseEntity<BaseResponse<Void>> bulkUpdateStatus(
            @Valid @RequestBody BulkUpdateStatusRequest request
    ) {
        service.bulkUpdateStatus(request.getIds(), request.getStatus());
        return ResponseEntity.ok(ResponseUtils.success("Bulk update completed successfully"));
    }
    
}



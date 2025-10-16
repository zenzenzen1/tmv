package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CreateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.request.UpdateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.response.ApplicationFormConfigResponse;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.service.ApplicationFormService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/application-forms")
@RequiredArgsConstructor
public class ApplicationFormController {

    private final ApplicationFormService applicationFormService;

    @PostMapping
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> create(
            @Valid @RequestBody CreateApplicationFormConfigRequest request
    ) {
        ApplicationFormConfigResponse data = applicationFormService.create(request);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }

    @GetMapping
    public ResponseEntity<BaseResponse<List<ApplicationFormConfigResponse>>> listAll() {
        List<ApplicationFormConfigResponse> data = applicationFormService.listAll();
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, data));
    }

    @GetMapping("/paginated")
    public ResponseEntity<BaseResponse<org.springframework.data.domain.Page<ApplicationFormConfigResponse>>> listPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String status
    ) {
        org.springframework.data.domain.Page<ApplicationFormConfigResponse> data = applicationFormService.listPaginated(
                page, size, search, dateFrom, dateTo, status);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, data));
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> getById(
            @PathVariable String id
    ) {
        ApplicationFormConfigResponse data = applicationFormService.getById(id);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, data));
    }

    @GetMapping("/type/{formType}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> getByFormType(
            @PathVariable ApplicationFormType formType
    ) {
        ApplicationFormConfigResponse data = applicationFormService.getByFormType(formType);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, data));
    }

    @PutMapping("/type/{formType}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> update(
            @PathVariable ApplicationFormType formType,
            @Valid @RequestBody UpdateApplicationFormConfigRequest request
    ) {
        ApplicationFormConfigResponse data = applicationFormService.update(formType, request);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }

    @PostMapping("/init-club-registration")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> initClubRegistrationForm() {
        ApplicationFormConfigResponse data = applicationFormService.createDefaultClubRegistrationForm();
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }
}

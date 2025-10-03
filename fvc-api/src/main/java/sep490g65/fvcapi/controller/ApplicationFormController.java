package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.UpdateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.response.ApplicationFormConfigResponse;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.service.ApplicationFormService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/application-forms")
@RequiredArgsConstructor
public class ApplicationFormController {

    private final ApplicationFormService applicationFormService;

    @GetMapping("/{formType}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> getByFormType(
            @PathVariable ApplicationFormType formType
    ) {
        ApplicationFormConfigResponse data = applicationFormService.getByFormType(formType);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, data));
    }

    @PutMapping("/{formType}")
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

package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
// use fully qualified name in method signature to avoid naming conflict
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
}



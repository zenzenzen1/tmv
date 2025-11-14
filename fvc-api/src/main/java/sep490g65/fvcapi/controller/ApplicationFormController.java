package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.CreateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.request.UpdateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.response.ApplicationFormConfigResponse;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PublicApplicationFormResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.service.ApplicationFormService;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/application-forms")
@RequiredArgsConstructor
public class ApplicationFormController {

    private final ApplicationFormService applicationFormService;
    private final ApplicationFormConfigRepository applicationFormConfigRepository;

    @PostMapping
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> create(
            @Valid @RequestBody CreateApplicationFormConfigRequest request
    ) {
        ApplicationFormConfigResponse data = applicationFormService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success(MessageConstants.APPLICATION_FORM_CREATED_SUCCESS, data));
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

    @GetMapping("/public")
    public ResponseEntity<BaseResponse<PaginationResponse<PublicApplicationFormResponse>>> listPublicForms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        PaginationResponse<PublicApplicationFormResponse> data = applicationFormService.listPublicForms(page, size);
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

    // Public endpoint to get form by slug
    @GetMapping("/public/{slug}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> getPublicBySlug(@PathVariable String slug) {
        ApplicationFormConfig config = applicationFormConfigRepository.findByPublicSlug(slug)
                .orElseThrow(() -> new RuntimeException("Public form not found"));
        // Allow published and postponed forms (postponed forms can be viewed but not submitted)
        if (config.getStatus() == null || 
            (!config.getStatus().name().equals("PUBLISH") && !config.getStatus().name().equals("POSTPONE"))) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseUtils.error("Form is not public", "FORM_NOT_PUBLIC"));
        }
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, applicationFormService.getById(config.getId())));
    }

    // Alternative GET endpoint for form type (without /type/ prefix) or by ID
    // Supports: GET /api/v1/application-forms/CLUB_REGISTRATION
    // Also supports: GET /api/v1/application-forms/{uuid-or-id}
    // This endpoint should be LAST so more specific routes (/id/, /type/, /public/) take precedence
    @GetMapping("/{identifier}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> getByIdentifier(
            @PathVariable String identifier
    ) {
        // First, try to match as ApplicationFormType enum
        try {
            ApplicationFormType type = ApplicationFormType.valueOf(identifier);
            ApplicationFormConfigResponse data = applicationFormService.getByFormType(type);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, data));
        } catch (IllegalArgumentException e) {
            // If not a valid enum, try to find by ID (UUID or other identifier)
            try {
                ApplicationFormConfigResponse data = applicationFormService.getById(identifier);
                return ResponseEntity.ok(ResponseUtils.success(MessageConstants.DATA_RETRIEVED, data));
            } catch (sep490g65.fvcapi.exception.custom.ResourceNotFoundException ex) {
                // getById throws ResourceNotFoundException when not found
                // Re-throw to let GlobalExceptionHandler handle it properly
                throw ex;
            } catch (Exception ex) {
                // For any other exception, return 404
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseUtils.error("Form not found: " + identifier, "NOT_FOUND"));
            }
        }
    }

    @PutMapping("/id/{id}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> updateById(
            @PathVariable String id,
            @Valid @RequestBody UpdateApplicationFormConfigRequest request
    ) {
        ApplicationFormConfigResponse data = applicationFormService.updateById(id, request);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }

    @PutMapping("/type/{formType}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> update(
            @PathVariable ApplicationFormType formType,
            @Valid @RequestBody UpdateApplicationFormConfigRequest request
    ) {
        ApplicationFormConfigResponse data = applicationFormService.update(formType, request);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }

    // Alternative PUT endpoint for updating by form type or ID (without /type/ or /id/ prefix)
    // Supports: PUT /api/v1/application-forms/CLUB_REGISTRATION
    // Also supports: PUT /api/v1/application-forms/{uuid-or-id}
    @PutMapping("/{identifier}")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> updateByIdentifier(
            @PathVariable String identifier,
            @Valid @RequestBody UpdateApplicationFormConfigRequest request
    ) {
        // First, try to match as ApplicationFormType enum
        try {
            ApplicationFormType type = ApplicationFormType.valueOf(identifier);
            ApplicationFormConfigResponse data = applicationFormService.update(type, request);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
        } catch (IllegalArgumentException e) {
            // If not a valid enum, try to update by ID (UUID or other identifier)
            try {
                ApplicationFormConfigResponse data = applicationFormService.updateById(identifier, request);
                return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
            } catch (sep490g65.fvcapi.exception.custom.ResourceNotFoundException ex) {
                // updateById throws ResourceNotFoundException when not found
                // Re-throw to let GlobalExceptionHandler handle it properly
                throw ex;
            } catch (Exception ex) {
                // For any other exception, return 404
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseUtils.error("Form not found: " + identifier, "NOT_FOUND"));
            }
        }
    }

    // Specific POST routes should be placed before generic routes
    @PostMapping("/init-club-registration")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> initClubRegistrationForm() {
        ApplicationFormConfigResponse data = applicationFormService.createDefaultClubRegistrationForm();
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }

    // This route must be before @PostMapping("/{identifier}") if it exists, or before any generic route
    @PostMapping("/club-registration/postpone")
    public ResponseEntity<BaseResponse<ApplicationFormConfigResponse>> postponeClubRegistrationForm() {
        ApplicationFormConfigResponse data = applicationFormService.postponeClubRegistrationForm();
        return ResponseEntity.ok(ResponseUtils.success("Form đăng ký câu lạc bộ đã được hoãn thành công", data));
    }
}

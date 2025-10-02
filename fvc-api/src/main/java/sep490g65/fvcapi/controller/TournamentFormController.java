package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.TournamentFormResponse;
import sep490g65.fvcapi.service.TournamentFormService;
import sep490g65.fvcapi.utils.ResponseUtils;
import sep490g65.fvcapi.enums.FormStatus;
import sep490g65.fvcapi.dto.response.SubmittedFormResponse;
import sep490g65.fvcapi.dto.request.UpdateFormStatusRequest;
import sep490g65.fvcapi.dto.request.UpdateSubmissionStatusRequest;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.TOURNAMENT_FORMS_PATH)
@RequiredArgsConstructor
@Slf4j
public class TournamentFormController {

    private final TournamentFormService tournamentFormService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<TournamentFormResponse>>> list(@Valid @org.springframework.web.bind.annotation.ModelAttribute RequestParam params) {
        PaginationResponse<TournamentFormResponse> data = tournamentFormService.list(params);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.TOURNAMENT_FORMS_RETRIEVED, data));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BaseResponse<Void>> updateStatus(@PathVariable String id, @RequestBody UpdateFormStatusRequest req) {
        tournamentFormService.updateStatus(id, req.getStatus());
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.TOURNAMENT_FORM_STATUS_UPDATED));
    }

    @GetMapping("/{id}/submissions")
    public ResponseEntity<BaseResponse<PaginationResponse<SubmittedFormResponse>>> listSubmissions(
            @PathVariable String id,
            @Valid @org.springframework.web.bind.annotation.ModelAttribute RequestParam params
    ) {
        PaginationResponse<SubmittedFormResponse> data = tournamentFormService.listSubmissions(id, params);
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS, data));
    }

    @PatchMapping("/submissions/{submissionId}/status")
    public ResponseEntity<BaseResponse<Void>> changeSubmissionStatus(@PathVariable Long submissionId,
                                                                     @RequestBody UpdateSubmissionStatusRequest req) {
        tournamentFormService.updateSubmissionStatus(submissionId, req.getStatus());
        return ResponseEntity.ok(ResponseUtils.success(MessageConstants.OPERATION_SUCCESS));
    }
}



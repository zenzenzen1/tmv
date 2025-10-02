package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.TournamentFormResponse;
import sep490g65.fvcapi.enums.FormStatus;
import sep490g65.fvcapi.dto.response.SubmittedFormResponse;

public interface TournamentFormService {
    PaginationResponse<TournamentFormResponse> list(RequestParam params);
    void updateStatus(String id, FormStatus status);
    PaginationResponse<SubmittedFormResponse> listSubmissions(String formId, RequestParam params);
    void updateSubmissionStatus(Long submissionId, sep490g65.fvcapi.enums.ApplicationFormStatus status);
}



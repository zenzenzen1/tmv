package sep490g65.fvcapi.service;

import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.SubmitApplicationFormRequest;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.SubmittedApplicationFormResponse;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.ApplicationFormStatus;

public interface SubmittedApplicationFormService {

    @Transactional(readOnly = true)
    PaginationResponse<SubmittedApplicationFormResponse> list(RequestParam params, ApplicationFormType type);
    
    @Transactional
    SubmittedApplicationFormResponse submit(SubmitApplicationFormRequest request) throws com.fasterxml.jackson.core.JsonProcessingException;
    
    @Transactional
    void updateStatus(Long id, ApplicationFormStatus status);
}



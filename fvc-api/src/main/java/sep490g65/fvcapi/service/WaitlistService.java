package sep490g65.fvcapi.service;

import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.AddToWaitlistRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;

public interface WaitlistService {

    @Transactional
    BaseResponse<Void> addToWaitlist(AddToWaitlistRequest request);

    @Transactional
    int processWaitlistForForm(String formId);
}


package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.UpdateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.response.ApplicationFormConfigResponse;
import sep490g65.fvcapi.enums.ApplicationFormType;

public interface ApplicationFormService {

    ApplicationFormConfigResponse getByFormType(ApplicationFormType formType);

    ApplicationFormConfigResponse update(ApplicationFormType formType, UpdateApplicationFormConfigRequest request);

    ApplicationFormConfigResponse createDefaultClubRegistrationForm();
}

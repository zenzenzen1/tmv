package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.CreateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.request.UpdateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.response.ApplicationFormConfigResponse;
import sep490g65.fvcapi.enums.ApplicationFormType;

import java.util.List;

public interface ApplicationFormService {

    List<ApplicationFormConfigResponse> listAll();

    ApplicationFormConfigResponse getById(String id);

    ApplicationFormConfigResponse getByFormType(ApplicationFormType formType);

    ApplicationFormConfigResponse create(CreateApplicationFormConfigRequest request);

    ApplicationFormConfigResponse update(ApplicationFormType formType, UpdateApplicationFormConfigRequest request);

    ApplicationFormConfigResponse createDefaultClubRegistrationForm();
}

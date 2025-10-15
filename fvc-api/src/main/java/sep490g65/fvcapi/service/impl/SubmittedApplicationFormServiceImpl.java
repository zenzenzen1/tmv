package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.SubmitApplicationFormRequest;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.SubmittedApplicationFormResponse;
import sep490g65.fvcapi.entity.SubmittedApplicationForm;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.repository.SubmittedApplicationFormRepository;
import sep490g65.fvcapi.service.SubmittedApplicationFormService;
import sep490g65.fvcapi.utils.ResponseUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmittedApplicationFormServiceImpl implements SubmittedApplicationFormService {

    private final SubmittedApplicationFormRepository repository;
    

    private SubmittedApplicationFormResponse toDto(SubmittedApplicationForm s) {
        return SubmittedApplicationFormResponse.builder()
                .id(s.getId())
                .formType(s.getFormType())
                .formData(s.getFormData())
                .status(s.getStatus())
                .reviewerNote(s.getReviewerNote())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .applicationFormConfigId(s.getApplicationFormConfig() != null ? s.getApplicationFormConfig().getId() : null)
                .userFullName(s.getUser() != null ? s.getUser().getFullName() : null)
                .userPersonalMail(s.getUser() != null ? s.getUser().getPersonalMail() : null)
                .userEduMail(s.getUser() != null ? s.getUser().getEduMail() : null)
                .userStudentCode(s.getUser() != null ? s.getUser().getStudentCode() : null)
                .userGender(s.getUser() != null ? s.getUser().getGender() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<SubmittedApplicationFormResponse> list(RequestParam params, ApplicationFormType type) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        Page<SubmittedApplicationForm> page = repository.search(type, pageable);
        return ResponseUtils.createPaginatedResponse(page.map(this::toDto));
    }
    
    @Override
    @Transactional
    public SubmittedApplicationFormResponse submit(SubmitApplicationFormRequest request) throws com.fasterxml.jackson.core.JsonProcessingException {
        // Create entity. Persist structured DTO as JSON string
        SubmittedApplicationForm entity = SubmittedApplicationForm.builder()
                .formType(request.getFormType())
                .formData(toJson(request.getFormData()))
                .reviewerNote(request.getReviewerNote())
                .status(ApplicationFormStatus.PENDING)
                .build();
        
        // Set user if provided
        if (request.getUserId() != null && !request.getUserId().trim().isEmpty()) {
            // TODO: Load user from repository and set it
            // entity.setUser(userRepository.findById(request.getUserId()).orElse(null));
        }
        
        // Set application form config if provided
        if (request.getApplicationFormConfigId() != null && !request.getApplicationFormConfigId().trim().isEmpty()) {
            // TODO: Load config from repository and set it
            // entity.setApplicationFormConfig(configRepository.findById(request.getApplicationFormConfigId()).orElse(null));
        }
        
        // Save entity
        SubmittedApplicationForm saved = repository.save(entity);
        
        // Return response
        return toDto(saved);
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}



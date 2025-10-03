package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.UpdateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.response.ApplicationFormConfigResponse;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.entity.ApplicationFormField;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.service.ApplicationFormService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationFormServiceImpl implements ApplicationFormService {

    private final ApplicationFormConfigRepository applicationFormConfigRepository;

    @Override
    public ApplicationFormConfigResponse getByFormType(ApplicationFormType formType) {
        ApplicationFormConfig config = applicationFormConfigRepository
                .findByFormTypeWithFields(formType)
                .orElseThrow(() -> new RuntimeException("Form config not found for type: " + formType));

        return mapToResponse(config);
    }

    @Override
    @Transactional
    public ApplicationFormConfigResponse update(ApplicationFormType formType, UpdateApplicationFormConfigRequest request) {
        ApplicationFormConfig config = applicationFormConfigRepository
                .findByFormTypeWithFields(formType)
                .orElseThrow(() -> new RuntimeException("Form config not found for type: " + formType));

        // Update basic info
        config.setName(request.getName());
        config.setDescription(request.getDescription());

        // Clear existing fields and add new ones
        config.getFields().clear();

        if (request.getFields() != null) {
            List<ApplicationFormField> newFields = request.getFields().stream()
                    .map(fieldRequest -> ApplicationFormField.builder()
                            .label(fieldRequest.getLabel())
                            .name(fieldRequest.getName())
                            .fieldType(fieldRequest.getFieldType())
                            .required(fieldRequest.getRequired())
                            .options(fieldRequest.getOptions())
                            .sortOrder(fieldRequest.getSortOrder())
                            .applicationFormConfig(config)
                            .build())
                    .collect(Collectors.toList());

            config.getFields().addAll(newFields);
        }

        ApplicationFormConfig savedConfig = applicationFormConfigRepository.save(config);
        return mapToResponse(savedConfig);
    }

    @Override
    @Transactional
    public ApplicationFormConfigResponse createDefaultClubRegistrationForm() {
        // Check if already exists
        if (applicationFormConfigRepository.findByFormType(ApplicationFormType.CLUB_REGISTRATION).isPresent()) {
            return getByFormType(ApplicationFormType.CLUB_REGISTRATION);
        }

        ApplicationFormConfig config = ApplicationFormConfig.builder()
                .name("Đăng kí tham gia FPTU Vovinam Club FALL 2025")
                .description("Form đăng ký tham gia Câu lạc bộ giúp bạn trở thành thành viên chính thức, kết nối với cộng đồng, tham gia các hoạt động và nhận thông tin mới nhất từ CLB. Vui lòng điền đầy đủ thông tin để Ban Tổ Chức xác nhận và sắp xếp phù hợp.")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .build();

        // Add default fields
        List<ApplicationFormField> defaultFields = List.of(
                ApplicationFormField.builder()
                        .label("Họ và tên")
                        .name("fullName")
                        .fieldType("TEXT")
                        .required(true)
                        .sortOrder(1)
                        .applicationFormConfig(config)
                        .build(),
                ApplicationFormField.builder()
                        .label("Email")
                        .name("email")
                        .fieldType("TEXT")
                        .required(true)
                        .sortOrder(2)
                        .applicationFormConfig(config)
                        .build(),
                ApplicationFormField.builder()
                        .label("MSSV")
                        .name("studentCode")
                        .fieldType("TEXT")
                        .required(true)
                        .sortOrder(3)
                        .applicationFormConfig(config)
                        .build(),
                ApplicationFormField.builder()
                        .label("SDT liên lạc")
                        .name("phone")
                        .fieldType("TEXT")
                        .required(false)
                        .sortOrder(4)
                        .applicationFormConfig(config)
                        .build(),
                ApplicationFormField.builder()
                        .label("Mô tả ngắn về bản thân")
                        .name("bio")
                        .fieldType("TEXT")
                        .required(false)
                        .sortOrder(5)
                        .applicationFormConfig(config)
                        .build()
        );

        config.setFields(defaultFields);
        ApplicationFormConfig savedConfig = applicationFormConfigRepository.save(config);
        return mapToResponse(savedConfig);
    }

    private ApplicationFormConfigResponse mapToResponse(ApplicationFormConfig config) {
        List<ApplicationFormConfigResponse.ApplicationFormFieldResponse> fieldResponses = config.getFields()
                .stream()
                .map(field -> ApplicationFormConfigResponse.ApplicationFormFieldResponse.builder()
                        .id(field.getId())
                        .label(field.getLabel())
                        .name(field.getName())
                        .fieldType(field.getFieldType())
                        .required(field.getRequired())
                        .options(field.getOptions())
                        .sortOrder(field.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return ApplicationFormConfigResponse.builder()
                .id(config.getId())
                .name(config.getName())
                .description(config.getDescription())
                .formType(config.getFormType())
                .fields(fieldResponses)
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}

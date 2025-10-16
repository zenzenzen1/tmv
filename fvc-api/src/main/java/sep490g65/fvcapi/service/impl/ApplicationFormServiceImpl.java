package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.request.UpdateApplicationFormConfigRequest;
import sep490g65.fvcapi.dto.response.ApplicationFormConfigResponse;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.entity.ApplicationFormField;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.service.ApplicationFormService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationFormServiceImpl implements ApplicationFormService {

    private final ApplicationFormConfigRepository applicationFormConfigRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationFormConfigResponse> listAll() {
        List<ApplicationFormConfig> configs = applicationFormConfigRepository.findAllWithFields();
        return configs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationFormConfigResponse getById(String id) {
        ApplicationFormConfig config = applicationFormConfigRepository
                .findByIdWithFields(id)
                .orElseThrow(() -> new RuntimeException("Form config not found with id: " + id));
        return mapToResponse(config);
    }

    @Override
    @Transactional
    public ApplicationFormConfigResponse create(CreateApplicationFormConfigRequest request) {
        ApplicationFormConfig config = ApplicationFormConfig.builder()
                .name(request.getName())
                .description(request.getDescription())
                .formType(request.getFormType())
                .build();

        if (request.getFields() != null) {
            List<ApplicationFormField> fields = request.getFields().stream()
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

            config.setFields(fields);
        }

        ApplicationFormConfig savedConfig = applicationFormConfigRepository.save(config);
        return mapToResponse(savedConfig);
    }

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
        // Find the most recent form config for this type
        List<ApplicationFormConfig> configs = applicationFormConfigRepository.findByFormTypeOrderByUpdatedAtDesc(formType);
        
        if (configs.isEmpty()) {
            throw new RuntimeException("Form config not found for type: " + formType);
        }
        
        ApplicationFormConfig config = configs.get(0); // Get the most recent one

        // Update basic info
        config.setName(request.getName());
        config.setDescription(request.getDescription());
        config.setEndDate(request.getEndDate());

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
                .endDate(config.getEndDate())
                .status(config.getStatus())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    @Transactional
    public void autoUnpublishExpiredForms() {
        LocalDateTime now = LocalDateTime.now();
        List<ApplicationFormConfig> expiredForms = applicationFormConfigRepository
                .findByEndDateBeforeAndStatus(now, FormStatus.PUBLISH);
        
        for (ApplicationFormConfig form : expiredForms) {
            form.setStatus(FormStatus.DRAFT);
            applicationFormConfigRepository.save(form);
        }
        
        if (!expiredForms.isEmpty()) {
            System.out.println("Auto-unpublished " + expiredForms.size() + " expired forms");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApplicationFormConfigResponse> listPaginated(int page, int size, String search, String dateFrom, String dateTo, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        
        // Parse dates
        LocalDateTime fromDate = null;
        LocalDateTime toDate = null;
        
        if (dateFrom != null && !dateFrom.trim().isEmpty()) {
            try {
                fromDate = LocalDateTime.parse(dateFrom + "T00:00:00");
            } catch (Exception e) {
                // Invalid date format, ignore
            }
        }
        
        if (dateTo != null && !dateTo.trim().isEmpty()) {
            try {
                toDate = LocalDateTime.parse(dateTo + "T23:59:59");
            } catch (Exception e) {
                // Invalid date format, ignore
            }
        }
        
        // Parse status
        FormStatus statusEnum = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                statusEnum = FormStatus.valueOf(status.toUpperCase());
            } catch (Exception e) {
                // Invalid status, ignore
            }
        }
        
        // Determine which filter method to use
        Page<ApplicationFormConfig> configs;
        
        try {
            boolean hasSearch = search != null && !search.trim().isEmpty();
            boolean hasStatus = statusEnum != null;
            boolean hasDateRange = fromDate != null && toDate != null;
            
            System.out.println("Filter conditions - search: " + hasSearch + ", status: " + hasStatus + ", dateRange: " + hasDateRange);
            
            if (!hasSearch && !hasStatus && !hasDateRange) {
                // No filters - get all
                configs = applicationFormConfigRepository.findAll(pageable);
                
                // If no data exists, create default form
                if (configs.getContent().isEmpty()) {
                    try {
                        createDefaultClubRegistrationForm();
                        configs = applicationFormConfigRepository.findAll(pageable);
                    } catch (Exception e) {
                        System.err.println("Failed to create default form: " + e.getMessage());
                    }
                }
            } else if (hasSearch && hasStatus && hasDateRange) {
                // All filters
                configs = applicationFormConfigRepository.findByAllFilters(search, statusEnum, fromDate, toDate, pageable);
            } else if (hasSearch && hasStatus) {
                // Search + Status
                configs = applicationFormConfigRepository.findBySearchAndStatus(search, statusEnum, pageable);
            } else if (hasSearch && hasDateRange) {
                // Search + Date Range
                configs = applicationFormConfigRepository.findBySearchAndDateRange(search, fromDate, toDate, pageable);
            } else if (hasStatus && hasDateRange) {
                // Status + Date Range
                configs = applicationFormConfigRepository.findByStatusAndDateRange(statusEnum, fromDate, toDate, pageable);
            } else if (hasSearch) {
                // Only search
                configs = applicationFormConfigRepository.findBySearch(search, pageable);
            } else if (hasStatus) {
                // Only status
                configs = applicationFormConfigRepository.findByStatus(statusEnum, pageable);
            } else if (hasDateRange) {
                // Only date range
                configs = applicationFormConfigRepository.findByDateRange(fromDate, toDate, pageable);
            } else {
                // Fallback
                configs = applicationFormConfigRepository.findAll(pageable);
            }
            
            System.out.println("Found " + configs.getContent().size() + " results");
            
        } catch (Exception e) {
            System.err.println("Filter query failed, falling back to findAll: " + e.getMessage());
            e.printStackTrace();
            configs = applicationFormConfigRepository.findAll(pageable);
        }
        
        return configs.map(this::mapToResponse);
    }
}

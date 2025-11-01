package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import sep490g65.fvcapi.exception.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.service.ApplicationFormService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import sep490g65.fvcapi.constants.MessageConstants;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
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
        log.info("Getting form by ID: {}", id);
        
        // First try with findByIdWithFields (includes fields)
        Optional<ApplicationFormConfig> configOpt = applicationFormConfigRepository.findByIdWithFields(id);
        
        if (configOpt.isPresent()) {
            log.info("Found form with fields: {}", id);
            return mapToResponse(configOpt.get());
        }
        
        // If not found, try regular findById (maybe fields weren't loaded)
        log.debug("Form not found with fields, trying regular findById: {}", id);
        configOpt = applicationFormConfigRepository.findById(id);
        
        if (configOpt.isPresent()) {
            log.info("Found form without fields, loading fields separately: {}", id);
            ApplicationFormConfig config = configOpt.get();
            
            // Re-fetch with fields to ensure fields are loaded
            config = applicationFormConfigRepository.findByIdWithFields(id)
                    .orElse(config); // Fallback to config without fields if query fails
            
            return mapToResponse(config);
        }
        
        // Check if form exists at all
        boolean exists = applicationFormConfigRepository.existsById(id);
        log.warn("Form with ID {} not found. Exists in DB: {}", id, exists);
        
        throw new ResourceNotFoundException("Form config not found with id: " + id);
    }

    @Override
    @Transactional
    public ApplicationFormConfigResponse create(CreateApplicationFormConfigRequest request) {
        // Validate business rules
        validateFormCreation(request);
        
        ApplicationFormConfig config = ApplicationFormConfig.builder()
                .name(request.getName())
                .description(request.getDescription())
                .formType(request.getFormType())
                .status(request.getStatus() != null ? request.getStatus() : FormStatus.DRAFT)
                .endDate(request.getEndDate())
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

        // Generate public slug if published
        if (config.getStatus() == FormStatus.PUBLISH && config.getPublicSlug() == null) {
            config.setPublicSlug(generateUniqueSlug(config.getName()));
        }

        ApplicationFormConfig savedConfig = applicationFormConfigRepository.save(config);
        return mapToResponse(savedConfig);
    }

    @Override
    public ApplicationFormConfigResponse getByFormType(ApplicationFormType formType) {
        ApplicationFormConfig config = applicationFormConfigRepository
                .findByFormTypeWithFields(formType)
                .orElseThrow(() -> new ResourceNotFoundException("Form config not found for type: " + formType));

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

        // Validate business rules for update
        validateFormUpdate(request, config);

        // Update basic info
        config.setName(request.getName());
        config.setDescription(request.getDescription());
        config.setEndDate(request.getEndDate());
        if (request.getStatus() != null) {
            config.setStatus(request.getStatus());
        }

        // Ensure slug exists when publishing
        if (config.getStatus() == FormStatus.PUBLISH && config.getPublicSlug() == null) {
            config.setPublicSlug(generateUniqueSlug(config.getName()));
        }

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
    public ApplicationFormConfigResponse updateById(String id, UpdateApplicationFormConfigRequest request) {
        ApplicationFormConfig config = applicationFormConfigRepository
                .findByIdWithFields(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form config not found with id: " + id));

        // Validate business rules for update
        validateFormUpdate(request, config);

        // Update basic info
        config.setName(request.getName());
        config.setDescription(request.getDescription());
        config.setEndDate(request.getEndDate());
        if (request.getStatus() != null) {
            config.setStatus(request.getStatus());
        }

        // Ensure slug exists when publishing
        if (config.getStatus() == FormStatus.PUBLISH && config.getPublicSlug() == null) {
            config.setPublicSlug(generateUniqueSlug(config.getName()));
        }

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

    @Transactional
    public void createTestClubRegistrationForms() {
        // Create test forms with different statuses
        String[] testNames = {
            "Đăng ký CLB Vovinam 2025",
            "Form đăng ký thành viên mới",
            "Đăng ký tham gia câu lạc bộ",
            "Form đăng ký CLB FALL 2025",
            "Đăng ký câu lạc bộ Vovinam",
            "Form thành viên CLB 2025"
        };
        
        FormStatus[] statuses = {FormStatus.DRAFT, FormStatus.PUBLISH, FormStatus.ARCHIVED, FormStatus.POSTPONE};
        
        for (int i = 0; i < testNames.length; i++) {
            ApplicationFormConfig config = ApplicationFormConfig.builder()
                .name(testNames[i])
                .description("Form đăng ký câu lạc bộ - " + (i + 1))
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(statuses[i % statuses.length])
                .build();
            
            // Add some basic fields
            List<ApplicationFormField> fields = Arrays.asList(
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
                    .build()
            );
            
            config.setFields(fields);
            applicationFormConfigRepository.save(config);
        }
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
                .publicLink(config.getPublicSlug() != null ? "/public/forms/" + config.getPublicSlug() : null)
                .build();
    }

    private String generateUniqueSlug(String base) {
        // Generate a secure, encrypted slug using Base64 URL-safe encoding
        // Combines two UUIDs (32 bytes = 256 bits entropy) for maximum security
        // The link will be hard to guess and appears encrypted
        java.util.Base64.Encoder encoder = java.util.Base64.getUrlEncoder().withoutPadding();
        String candidate;
        int attempts = 0;
        
        do {
            UUID uuid1 = UUID.randomUUID();
            UUID uuid2 = UUID.randomUUID();
            
            // Convert UUIDs to byte arrays
            java.nio.ByteBuffer buffer = java.nio.ByteBuffer.allocate(32);
            buffer.putLong(uuid1.getMostSignificantBits());
            buffer.putLong(uuid1.getLeastSignificantBits());
            buffer.putLong(uuid2.getMostSignificantBits());
            buffer.putLong(uuid2.getLeastSignificantBits());
            
            // Encode to Base64 URL-safe string
            byte[] combinedBytes = buffer.array();
            String encodedSlug = encoder.encodeToString(combinedBytes);
            
            // Prefix with 'f' to indicate form (optional, can be removed)
            candidate = "f" + encodedSlug;
            attempts++;
            
            if (attempts >= 10) {
                log.warn("Failed to generate unique slug after 10 attempts, using UUID fallback");
                // Fallback: use simple UUID if too many collisions (extremely rare)
                candidate = "f" + UUID.randomUUID().toString().replace("-", "");
                break;
            }
        } while (applicationFormConfigRepository.existsByPublicSlug(candidate));
        
        return candidate;
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
                // No filters - get all CLUB_REGISTRATION forms only
                configs = applicationFormConfigRepository.findAllClubRegistration(pageable);
                
                // If no data exists, create default form and test data
                if (configs.getContent().isEmpty()) {
                    try {
                        createDefaultClubRegistrationForm();
                        createTestClubRegistrationForms();
                        configs = applicationFormConfigRepository.findAllClubRegistration(pageable);
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
                // Fallback - get all CLUB_REGISTRATION forms only
                configs = applicationFormConfigRepository.findAllClubRegistration(pageable);
            }
            
            System.out.println("Found " + configs.getContent().size() + " results");
            
        } catch (Exception e) {
            System.err.println("Filter query failed, falling back to findAllClubRegistration: " + e.getMessage());
            e.printStackTrace();
            configs = applicationFormConfigRepository.findAllClubRegistration(pageable);
        }
        
        return configs.map(this::mapToResponse);
    }

    /**
     * Validates form creation business rules
     */
    private void validateFormCreation(CreateApplicationFormConfigRequest request) {
        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BusinessException(
                "Form name is required",
                "FORM_NAME_REQUIRED"
            );
        }
        
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new BusinessException(
                "Form description is required",
                "FORM_DESCRIPTION_REQUIRED"
            );
        }
        
        // Check if form name already exists
        if (applicationFormConfigRepository.existsByName(request.getName())) {
            throw new BusinessException(
                String.format(MessageConstants.APPLICATION_FORM_ALREADY_EXISTS, request.getName()),
                "FORM_NAME_EXISTS"
            );
        }
        
        // Check if trying to publish without end date
        if (request.getStatus() == FormStatus.PUBLISH && request.getEndDate() == null) {
            throw new BusinessException(
                MessageConstants.APPLICATION_FORM_PUBLISH_WITHOUT_END_DATE,
                "PUBLISH_WITHOUT_END_DATE"
            );
        }
    }

    /**
     * Validates form update business rules
     */
    private void validateFormUpdate(UpdateApplicationFormConfigRequest request, ApplicationFormConfig existingConfig) {
        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BusinessException(
                "Form name is required",
                "FORM_NAME_REQUIRED"
            );
        }
        
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new BusinessException(
                "Form description is required",
                "FORM_DESCRIPTION_REQUIRED"
            );
        }
        
        // Check if form name already exists (excluding current form)
        if (!request.getName().equals(existingConfig.getName()) && 
            applicationFormConfigRepository.existsByName(request.getName())) {
            throw new BusinessException(
                String.format(MessageConstants.APPLICATION_FORM_ALREADY_EXISTS, request.getName()),
                "FORM_NAME_EXISTS"
            );
        }
        
        // Check if trying to publish without end date
        if (request.getStatus() == FormStatus.PUBLISH && request.getEndDate() == null) {
            throw new BusinessException(
                MessageConstants.APPLICATION_FORM_PUBLISH_WITHOUT_END_DATE,
                "PUBLISH_WITHOUT_END_DATE"
            );
        }
    }
}

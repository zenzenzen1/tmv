package sep490g65.fvcapi.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.test.util.ReflectionTestUtils;
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

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApplicationFormServiceImpl Unit Tests")
class ApplicationFormServiceImplTest {

    @Mock
    private ApplicationFormConfigRepository applicationFormConfigRepository;

    @InjectMocks
    private ApplicationFormServiceImpl applicationFormService;

    private ApplicationFormConfig testConfig;
    private ApplicationFormField testField;
    private CreateApplicationFormConfigRequest createRequest;
    private UpdateApplicationFormConfigRequest updateRequest;

    @BeforeEach
    void setUp() {
        // Setup test data
        testConfig = ApplicationFormConfig.builder()
                .id("test-id-123")
                .name("Test Form")
                .description("Test Description")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(FormStatus.DRAFT)
                .endDate(LocalDateTime.now().plusDays(30))
                .publicSlug(null)
                .fields(new ArrayList<>())
                .build();
        
        // Set BaseEntity fields separately
        testConfig.setCreatedAt(LocalDateTime.now());
        testConfig.setUpdatedAt(LocalDateTime.now());

        testField = ApplicationFormField.builder()
                .id("field-id-123")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .applicationFormConfig(testConfig)
                .build();

        testConfig.getFields().add(testField);

        createRequest = CreateApplicationFormConfigRequest.builder()
                .name("New Form")
                .description("New Description")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(FormStatus.DRAFT)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(new ArrayList<>())
                .build();

        updateRequest = UpdateApplicationFormConfigRequest.builder()
                .name("Updated Form")
                .description("Updated Description")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(new ArrayList<>())
                .build();
    }

    // ========== listAll() Tests ==========

    @Test
    @DisplayName("listAll - Should return list of all forms successfully")
    void testListAll_Success() {
        // Given
        List<ApplicationFormConfig> configs = Arrays.asList(testConfig);
        when(applicationFormConfigRepository.findAllWithFields()).thenReturn(configs);

        // When
        List<ApplicationFormConfigResponse> result = applicationFormService.listAll();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Form", result.get(0).getName());
        verify(applicationFormConfigRepository, times(1)).findAllWithFields();
    }

    @Test
    @DisplayName("listAll - Should return empty list when no forms exist")
    void testListAll_EmptyList() {
        // Given
        when(applicationFormConfigRepository.findAllWithFields()).thenReturn(Collections.emptyList());

        // When
        List<ApplicationFormConfigResponse> result = applicationFormService.listAll();

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(applicationFormConfigRepository, times(1)).findAllWithFields();
    }

    @Test
    @DisplayName("listAll - Should handle multiple forms correctly")
    void testListAll_MultipleForms() {
        // Given
        ApplicationFormConfig config2 = ApplicationFormConfig.builder()
                .id("test-id-456")
                .name("Test Form 2")
                .description("Test Description 2")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(FormStatus.PUBLISH)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> configs = Arrays.asList(testConfig, config2);
        when(applicationFormConfigRepository.findAllWithFields()).thenReturn(configs);

        // When
        List<ApplicationFormConfigResponse> result = applicationFormService.listAll();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(applicationFormConfigRepository, times(1)).findAllWithFields();
    }

    // ========== getById() Tests ==========

    @Test
    @DisplayName("getById - Should return form when found with fields")
    void testGetById_Success_WithFields() {
        // Given
        String id = "test-id-123";
        when(applicationFormConfigRepository.findByIdWithFields(id)).thenReturn(Optional.of(testConfig));

        // When
        ApplicationFormConfigResponse result = applicationFormService.getById(id);

        // Then
        assertNotNull(result);
        assertEquals(id, result.getId());
        assertEquals("Test Form", result.getName());
        verify(applicationFormConfigRepository, times(1)).findByIdWithFields(id);
        verify(applicationFormConfigRepository, never()).findById(id);
    }

    @Test
    @DisplayName("getById - Should return form when found without fields initially")
    void testGetById_Success_WithoutFieldsInitially() {
        // Given
        String id = "test-id-123";
        // First call to findByIdWithFields returns empty
        // Then findById finds the config
        // Then second call to findByIdWithFields (to re-fetch with fields) returns the config
        when(applicationFormConfigRepository.findByIdWithFields(id))
                .thenReturn(Optional.empty())  // First call
                .thenReturn(Optional.of(testConfig));  // Second call (line 71)
        when(applicationFormConfigRepository.findById(id)).thenReturn(Optional.of(testConfig));

        // When
        ApplicationFormConfigResponse result = applicationFormService.getById(id);

        // Then
        assertNotNull(result);
        assertEquals(id, result.getId());
        verify(applicationFormConfigRepository, times(2)).findByIdWithFields(id);
        verify(applicationFormConfigRepository, times(1)).findById(id);
    }

    @Test
    @DisplayName("getById - Should throw ResourceNotFoundException when form not found")
    void testGetById_NotFound() {
        // Given
        String id = "non-existent-id";
        when(applicationFormConfigRepository.findByIdWithFields(id)).thenReturn(Optional.empty());
        when(applicationFormConfigRepository.findById(id)).thenReturn(Optional.empty());
        when(applicationFormConfigRepository.existsById(id)).thenReturn(false);

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> {
            applicationFormService.getById(id);
        });

        verify(applicationFormConfigRepository, times(1)).findByIdWithFields(id);
        verify(applicationFormConfigRepository, times(1)).findById(id);
        verify(applicationFormConfigRepository, times(1)).existsById(id);
    }

    @Test
    @DisplayName("getById - Should handle null id")
    void testGetById_NullId() {
        // Given
        String id = null;
        when(applicationFormConfigRepository.findByIdWithFields(id)).thenReturn(Optional.empty());
        when(applicationFormConfigRepository.findById(id)).thenReturn(Optional.empty());
        when(applicationFormConfigRepository.existsById(id)).thenReturn(false);

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> {
            applicationFormService.getById(id);
        });
    }

    // ========== getByFormType() Tests ==========

    @Test
    @DisplayName("getByFormType - Should return form when found")
    void testGetByFormType_Success() {
        // Given
        ApplicationFormType formType = ApplicationFormType.CLUB_REGISTRATION;
        when(applicationFormConfigRepository.findByFormTypeWithFields(formType))
                .thenReturn(Optional.of(testConfig));

        // When
        ApplicationFormConfigResponse result = applicationFormService.getByFormType(formType);

        // Then
        assertNotNull(result);
        assertEquals(formType, result.getFormType());
        verify(applicationFormConfigRepository, times(1)).findByFormTypeWithFields(formType);
    }

    @Test
    @DisplayName("getByFormType - Should throw ResourceNotFoundException when form not found")
    void testGetByFormType_NotFound() {
        // Given
        ApplicationFormType formType = ApplicationFormType.CLUB_REGISTRATION;
        when(applicationFormConfigRepository.findByFormTypeWithFields(formType))
                .thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> {
            applicationFormService.getByFormType(formType);
        });

        verify(applicationFormConfigRepository, times(1)).findByFormTypeWithFields(formType);
    }

    // ========== create() Tests ==========

    @Test
    @DisplayName("create - Should create form successfully with valid request")
    void testCreate_Success() {
        // Given
        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        ApplicationFormConfigResponse result = applicationFormService.create(createRequest);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).existsByName(createRequest.getName());
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("create - Should throw BusinessException when name is empty")
    void testCreate_EmptyName() {
        // Given
        createRequest.setName("");

        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            applicationFormService.create(createRequest);
        });

        assertEquals("FORM_NAME_REQUIRED", exception.getErrorCode());
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("create - Should throw BusinessException when name is null")
    void testCreate_NullName() {
        // Given
        createRequest.setName(null);

        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            applicationFormService.create(createRequest);
        });

        assertEquals("FORM_NAME_REQUIRED", exception.getErrorCode());
    }

    @Test
    @DisplayName("create - Should throw BusinessException when description is empty")
    void testCreate_EmptyDescription() {
        // Given
        createRequest.setDescription("");

        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            applicationFormService.create(createRequest);
        });

        assertEquals("FORM_DESCRIPTION_REQUIRED", exception.getErrorCode());
    }

    @Test
    @DisplayName("create - Should throw BusinessException when name already exists")
    void testCreate_DuplicateName() {
        // Given
        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(true);

        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            applicationFormService.create(createRequest);
        });

        assertEquals("FORM_NAME_EXISTS", exception.getErrorCode());
        verify(applicationFormConfigRepository, times(1)).existsByName(createRequest.getName());
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("create - Should throw BusinessException when trying to publish without end date")
    void testCreate_PublishWithoutEndDate() {
        // Given
        createRequest.setStatus(FormStatus.PUBLISH);
        createRequest.setEndDate(null);
        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(false);

        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            applicationFormService.create(createRequest);
        });

        assertEquals("PUBLISH_WITHOUT_END_DATE", exception.getErrorCode());
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("create - Should generate slug when status is PUBLISH")
    void testCreate_GenerateSlugWhenPublished() {
        // Given
        createRequest.setStatus(FormStatus.PUBLISH);
        createRequest.setEndDate(LocalDateTime.now().plusDays(30));
        testConfig.setStatus(FormStatus.PUBLISH);
        testConfig.setPublicSlug("fgenerated-slug-123");

        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.existsByPublicSlug(anyString())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        ApplicationFormConfigResponse result = applicationFormService.create(createRequest);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("create - Should create form with fields successfully")
    void testCreate_WithFields() {
        // Given
        CreateApplicationFormConfigRequest.ApplicationFormFieldRequest fieldRequest =
                CreateApplicationFormConfigRequest.ApplicationFormFieldRequest.builder()
                        .label("Email")
                        .name("email")
                        .fieldType("EMAIL")
                        .required(true)
                        .sortOrder(1)
                        .build();

        createRequest.setFields(Arrays.asList(fieldRequest));
        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        ApplicationFormConfigResponse result = applicationFormService.create(createRequest);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("create - Should use DRAFT status when status is null")
    void testCreate_DefaultStatusDraft() {
        // Given
        createRequest.setStatus(null);
        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenAnswer(invocation -> {
            ApplicationFormConfig config = invocation.getArgument(0);
            assertEquals(FormStatus.DRAFT, config.getStatus());
            return testConfig;
        });

        // When
        applicationFormService.create(createRequest);

        // Then
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    // ========== update() Tests ==========

    @Test
    @DisplayName("update - Should update form successfully")
    void testUpdate_Success() {
        // Given
        ApplicationFormType formType = ApplicationFormType.CLUB_REGISTRATION;
        List<ApplicationFormConfig> configs = Arrays.asList(testConfig);
        when(applicationFormConfigRepository.findByFormTypeOrderByUpdatedAtDesc(formType)).thenReturn(configs);
        when(applicationFormConfigRepository.existsByName(updateRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        ApplicationFormConfigResponse result = applicationFormService.update(formType, updateRequest);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).findByFormTypeOrderByUpdatedAtDesc(formType);
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("update - Should throw RuntimeException when form not found")
    void testUpdate_NotFound() {
        // Given
        ApplicationFormType formType = ApplicationFormType.CLUB_REGISTRATION;
        when(applicationFormConfigRepository.findByFormTypeOrderByUpdatedAtDesc(formType))
                .thenReturn(Collections.emptyList());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            applicationFormService.update(formType, updateRequest);
        });

        verify(applicationFormConfigRepository, times(1)).findByFormTypeOrderByUpdatedAtDesc(formType);
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("update - Should throw BusinessException when name is empty")
    void testUpdate_EmptyName() {
        // Given
        ApplicationFormType formType = ApplicationFormType.CLUB_REGISTRATION;
        updateRequest.setName("");
        List<ApplicationFormConfig> configs = Arrays.asList(testConfig);
        when(applicationFormConfigRepository.findByFormTypeOrderByUpdatedAtDesc(formType)).thenReturn(configs);

        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            applicationFormService.update(formType, updateRequest);
        });

        assertEquals("FORM_NAME_REQUIRED", exception.getErrorCode());
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("update - Should generate slug when publishing")
    void testUpdate_GenerateSlugWhenPublishing() {
        // Given
        ApplicationFormType formType = ApplicationFormType.CLUB_REGISTRATION;
        updateRequest.setStatus(FormStatus.PUBLISH);
        updateRequest.setEndDate(LocalDateTime.now().plusDays(30));
        testConfig.setStatus(FormStatus.DRAFT); // Start with DRAFT, will be updated to PUBLISH
        testConfig.setPublicSlug(null); // No slug initially

        List<ApplicationFormConfig> configs = Arrays.asList(testConfig);
        when(applicationFormConfigRepository.findByFormTypeOrderByUpdatedAtDesc(formType)).thenReturn(configs);
        when(applicationFormConfigRepository.existsByName(updateRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.existsByPublicSlug(anyString())).thenReturn(false); // Slug generation will check this
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenAnswer(invocation -> {
            ApplicationFormConfig config = invocation.getArgument(0);
            // Verify slug is generated when status is PUBLISH
            if (config.getStatus() == FormStatus.PUBLISH && config.getPublicSlug() == null) {
                config.setPublicSlug("fgenerated-slug-123");
            }
            return config;
        });

        // When
        ApplicationFormConfigResponse result = applicationFormService.update(formType, updateRequest);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
        verify(applicationFormConfigRepository, atLeastOnce()).existsByPublicSlug(anyString());
    }

    @Test
    @DisplayName("update - Should clear and replace existing fields")
    void testUpdate_ClearAndReplaceFields() {
        // Given
        ApplicationFormType formType = ApplicationFormType.CLUB_REGISTRATION;
        UpdateApplicationFormConfigRequest.ApplicationFormFieldRequest newField =
                UpdateApplicationFormConfigRequest.ApplicationFormFieldRequest.builder()
                        .label("Phone")
                        .name("phone")
                        .fieldType("TEXT")
                        .required(false)
                        .sortOrder(1)
                        .build();

        updateRequest.setFields(Arrays.asList(newField));
        List<ApplicationFormConfig> configs = Arrays.asList(testConfig);
        when(applicationFormConfigRepository.findByFormTypeOrderByUpdatedAtDesc(formType)).thenReturn(configs);
        when(applicationFormConfigRepository.existsByName(updateRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenAnswer(invocation -> {
            ApplicationFormConfig config = invocation.getArgument(0);
            assertEquals(1, config.getFields().size());
            return config;
        });

        // When
        applicationFormService.update(formType, updateRequest);

        // Then
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    // ========== updateById() Tests ==========

    @Test
    @DisplayName("updateById - Should update form successfully")
    void testUpdateById_Success() {
        // Given
        String id = "test-id-123";
        when(applicationFormConfigRepository.findByIdWithFields(id)).thenReturn(Optional.of(testConfig));
        when(applicationFormConfigRepository.existsByName(updateRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        ApplicationFormConfigResponse result = applicationFormService.updateById(id, updateRequest);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).findByIdWithFields(id);
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("updateById - Should throw ResourceNotFoundException when form not found")
    void testUpdateById_NotFound() {
        // Given
        String id = "non-existent-id";
        when(applicationFormConfigRepository.findByIdWithFields(id)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> {
            applicationFormService.updateById(id, updateRequest);
        });

        verify(applicationFormConfigRepository, times(1)).findByIdWithFields(id);
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateById - Should allow updating with same name")
    void testUpdateById_SameName() {
        // Given
        String id = "test-id-123";
        updateRequest.setName(testConfig.getName()); // Same name
        when(applicationFormConfigRepository.findByIdWithFields(id)).thenReturn(Optional.of(testConfig));
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        ApplicationFormConfigResponse result = applicationFormService.updateById(id, updateRequest);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).findByIdWithFields(id);
        verify(applicationFormConfigRepository, never()).existsByName(anyString());
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    // ========== createDefaultClubRegistrationForm() Tests ==========

    @Test
    @DisplayName("createDefaultClubRegistrationForm - Should create default form when not exists")
    void testCreateDefaultClubRegistrationForm_NewForm() {
        // Given
        when(applicationFormConfigRepository.findByFormType(ApplicationFormType.CLUB_REGISTRATION))
                .thenReturn(Optional.empty());
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        ApplicationFormConfigResponse result = applicationFormService.createDefaultClubRegistrationForm();

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).findByFormType(ApplicationFormType.CLUB_REGISTRATION);
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("createDefaultClubRegistrationForm - Should return existing form when already exists")
    void testCreateDefaultClubRegistrationForm_AlreadyExists() {
        // Given
        when(applicationFormConfigRepository.findByFormType(ApplicationFormType.CLUB_REGISTRATION))
                .thenReturn(Optional.of(testConfig));
        when(applicationFormConfigRepository.findByFormTypeWithFields(ApplicationFormType.CLUB_REGISTRATION))
                .thenReturn(Optional.of(testConfig));

        // When
        ApplicationFormConfigResponse result = applicationFormService.createDefaultClubRegistrationForm();

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).findByFormType(ApplicationFormType.CLUB_REGISTRATION);
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("createDefaultClubRegistrationForm - Should create form with 5 default fields")
    void testCreateDefaultClubRegistrationForm_DefaultFields() {
        // Given
        when(applicationFormConfigRepository.findByFormType(ApplicationFormType.CLUB_REGISTRATION))
                .thenReturn(Optional.empty());
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenAnswer(invocation -> {
            ApplicationFormConfig config = invocation.getArgument(0);
            assertEquals(5, config.getFields().size());
            return config;
        });

        // When
        applicationFormService.createDefaultClubRegistrationForm();

        // Then
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    // ========== listPaginated() Tests ==========

    @Test
    @DisplayName("listPaginated - Should return paginated results without filters")
    void testListPaginated_NoFilters() {
        // Given
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        when(applicationFormConfigRepository.findAllClubRegistration(pageable)).thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, null, null, null, null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(applicationFormConfigRepository, times(1)).findAllClubRegistration(pageable);
    }

    @Test
    @DisplayName("listPaginated - Should handle search filter")
    void testListPaginated_WithSearch() {
        // Given
        String search = "Test";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        when(applicationFormConfigRepository.findBySearch(search, pageable)).thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, search, null, null, null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(applicationFormConfigRepository, times(1)).findBySearch(search, pageable);
    }

    @Test
    @DisplayName("listPaginated - Should handle status filter")
    void testListPaginated_WithStatus() {
        // Given
        String status = "DRAFT";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        when(applicationFormConfigRepository.findByStatus(FormStatus.DRAFT, pageable)).thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, null, null, null, status);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(applicationFormConfigRepository, times(1)).findByStatus(FormStatus.DRAFT, pageable);
    }

    @Test
    @DisplayName("listPaginated - Should handle date range filter")
    void testListPaginated_WithDateRange() {
        // Given
        String dateFrom = "2024-01-01";
        String dateTo = "2024-12-31";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        when(applicationFormConfigRepository.findByDateRange(any(LocalDateTime.class), any(LocalDateTime.class), eq(pageable)))
                .thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, null, dateFrom, dateTo, null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("listPaginated - Should handle all filters combined")
    void testListPaginated_AllFilters() {
        // Given
        String search = "Test";
        String status = "DRAFT";
        String dateFrom = "2024-01-01";
        String dateTo = "2024-12-31";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        when(applicationFormConfigRepository.findByAllFilters(eq(search), eq(FormStatus.DRAFT), any(LocalDateTime.class), any(LocalDateTime.class), eq(pageable)))
                .thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, search, dateFrom, dateTo, status);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("listPaginated - Should handle invalid date format gracefully")
    void testListPaginated_InvalidDateFormat() {
        // Given
        String invalidDate = "invalid-date";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        when(applicationFormConfigRepository.findAllClubRegistration(pageable)).thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, null, invalidDate, null, null);

        // Then
        assertNotNull(result);
        // Should fallback to default query
    }

    @Test
    @DisplayName("listPaginated - Should handle invalid status gracefully")
    void testListPaginated_InvalidStatus() {
        // Given
        String invalidStatus = "INVALID_STATUS";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        when(applicationFormConfigRepository.findAllClubRegistration(pageable)).thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, null, null, null, invalidStatus);

        // Then
        assertNotNull(result);
        // Should fallback to default query
    }

    @Test
    @DisplayName("listPaginated - Should create default form when no results")
    void testListPaginated_CreateDefaultWhenEmpty() {
        // Given
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
        Page<ApplicationFormConfig> pageWithData = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);

        when(applicationFormConfigRepository.findAllClubRegistration(pageable))
                .thenReturn(emptyPage)
                .thenReturn(pageWithData);
        when(applicationFormConfigRepository.findByFormType(ApplicationFormType.CLUB_REGISTRATION))
                .thenReturn(Optional.empty());
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, null, null, null, null);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, atLeastOnce()).findAllClubRegistration(pageable);
    }

    @Test
    @DisplayName("listPaginated - Should handle exception and fallback gracefully")
    void testListPaginated_ExceptionFallback() {
        // Given
        String search = "Test";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<ApplicationFormConfig> page = new PageImpl<>(Arrays.asList(testConfig), pageable, 1);
        
        when(applicationFormConfigRepository.findBySearch(search, pageable))
                .thenThrow(new RuntimeException("Database error"));
        when(applicationFormConfigRepository.findAllClubRegistration(pageable)).thenReturn(page);

        // When
        Page<ApplicationFormConfigResponse> result = applicationFormService.listPaginated(0, 10, search, null, null, null);

        // Then
        assertNotNull(result);
        verify(applicationFormConfigRepository, times(1)).findAllClubRegistration(pageable);
    }

    // ========== autoUnpublishExpiredForms() Tests ==========

    @Test
    @DisplayName("autoUnpublishExpiredForms - Should archive expired published forms")
    void testAutoUnpublishExpiredForms_ArchiveExpired() {
        // Given
        ApplicationFormConfig expiredForm = ApplicationFormConfig.builder()
                .id("expired-id")
                .name("Expired Form")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().minusDays(1))
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> expiredForms = Arrays.asList(expiredForm);
        when(applicationFormConfigRepository.findByEndDateBeforeAndStatus(any(LocalDateTime.class), eq(FormStatus.PUBLISH)))
                .thenReturn(expiredForms);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenAnswer(invocation -> {
            ApplicationFormConfig config = invocation.getArgument(0);
            assertEquals(FormStatus.ARCHIVED, config.getStatus());
            return config;
        });

        // When
        applicationFormService.autoUnpublishExpiredForms();

        // Then
        verify(applicationFormConfigRepository, times(1))
                .findByEndDateBeforeAndStatus(any(LocalDateTime.class), eq(FormStatus.PUBLISH));
        verify(applicationFormConfigRepository, times(1)).save(expiredForm);
    }

    @Test
    @DisplayName("autoUnpublishExpiredForms - Should handle no expired forms")
    void testAutoUnpublishExpiredForms_NoExpiredForms() {
        // Given
        when(applicationFormConfigRepository.findByEndDateBeforeAndStatus(any(LocalDateTime.class), eq(FormStatus.PUBLISH)))
                .thenReturn(Collections.emptyList());

        // When
        applicationFormService.autoUnpublishExpiredForms();

        // Then
        verify(applicationFormConfigRepository, times(1))
                .findByEndDateBeforeAndStatus(any(LocalDateTime.class), eq(FormStatus.PUBLISH));
        verify(applicationFormConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("autoUnpublishExpiredForms - Should handle multiple expired forms")
    void testAutoUnpublishExpiredForms_MultipleExpired() {
        // Given
        ApplicationFormConfig expiredForm1 = ApplicationFormConfig.builder()
                .id("expired-id-1")
                .name("Expired Form 1")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().minusDays(1))
                .fields(new ArrayList<>())
                .build();

        ApplicationFormConfig expiredForm2 = ApplicationFormConfig.builder()
                .id("expired-id-2")
                .name("Expired Form 2")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().minusDays(2))
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> expiredForms = Arrays.asList(expiredForm1, expiredForm2);
        when(applicationFormConfigRepository.findByEndDateBeforeAndStatus(any(LocalDateTime.class), eq(FormStatus.PUBLISH)))
                .thenReturn(expiredForms);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        applicationFormService.autoUnpublishExpiredForms();

        // Then
        verify(applicationFormConfigRepository, times(1))
                .findByEndDateBeforeAndStatus(any(LocalDateTime.class), eq(FormStatus.PUBLISH));
        verify(applicationFormConfigRepository, times(2)).save(any(ApplicationFormConfig.class));
    }

    // ========== Private Methods Testing (via public methods) ==========

    @Test
    @DisplayName("generateUniqueSlug - Should generate unique slug")
    void testGenerateUniqueSlug_Unique() {
        // Given
        String base = "Test Form";
        when(applicationFormConfigRepository.existsByPublicSlug(anyString())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        createRequest.setStatus(FormStatus.PUBLISH);
        createRequest.setEndDate(LocalDateTime.now().plusDays(30));
        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(false);

        // When
        applicationFormService.create(createRequest);

        // Then
        verify(applicationFormConfigRepository, atLeastOnce()).existsByPublicSlug(anyString());
        verify(applicationFormConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("generateUniqueSlug - Should handle slug collision and retry")
    void testGenerateUniqueSlug_CollisionRetry() {
        // Given
        when(applicationFormConfigRepository.existsByPublicSlug(anyString()))
                .thenReturn(true)  // First attempt collision
                .thenReturn(true)   // Second attempt collision
                .thenReturn(false); // Third attempt successful

        createRequest.setStatus(FormStatus.PUBLISH);
        createRequest.setEndDate(LocalDateTime.now().plusDays(30));
        when(applicationFormConfigRepository.existsByName(createRequest.getName())).thenReturn(false);
        when(applicationFormConfigRepository.save(any(ApplicationFormConfig.class))).thenReturn(testConfig);

        // When
        applicationFormService.create(createRequest);

        // Then
        verify(applicationFormConfigRepository, atLeast(3)).existsByPublicSlug(anyString());
    }

    @Test
    @DisplayName("mapToResponse - Should map entity to response correctly")
    void testMapToResponse_CompleteMapping() {
        // Given
        testConfig.setPublicSlug("test-slug");
        when(applicationFormConfigRepository.findAllWithFields()).thenReturn(Arrays.asList(testConfig));

        // When
        List<ApplicationFormConfigResponse> result = applicationFormService.listAll();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        ApplicationFormConfigResponse response = result.get(0);
        assertEquals(testConfig.getId(), response.getId());
        assertEquals(testConfig.getName(), response.getName());
        assertEquals(testConfig.getDescription(), response.getDescription());
        assertEquals("/public/forms/test-slug", response.getPublicLink());
        assertNotNull(response.getFields());
    }

    @Test
    @DisplayName("mapToResponse - Should handle null public slug")
    void testMapToResponse_NullPublicSlug() {
        // Given
        testConfig.setPublicSlug(null);
        when(applicationFormConfigRepository.findAllWithFields()).thenReturn(Arrays.asList(testConfig));

        // When
        List<ApplicationFormConfigResponse> result = applicationFormService.listAll();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertNull(result.get(0).getPublicLink());
    }
}


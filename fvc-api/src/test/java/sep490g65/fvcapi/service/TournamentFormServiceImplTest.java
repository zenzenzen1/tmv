package sep490g65.fvcapi.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sep490g65.fvcapi.dto.request.CreateFormRequest;
import sep490g65.fvcapi.dto.request.CreateSubmissionRequest;
import sep490g65.fvcapi.dto.request.FormFieldUpsert;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateFormRequest;
import sep490g65.fvcapi.entity.SubmittedApplicationForm;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.entity.CompetitionRole;
import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.enums.CompetitionRoleType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import sep490g65.fvcapi.dto.response.FormDetailResponse;
import sep490g65.fvcapi.dto.response.FormFieldDto;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.TournamentFormResponse;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.entity.ApplicationFormField;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.FormStatus;
import sep490g65.fvcapi.repository.*;
import sep490g65.fvcapi.service.AthleteService;
import sep490g65.fvcapi.service.PerformanceService;
import sep490g65.fvcapi.service.impl.TournamentFormServiceImpl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TournamentFormService Create Method Unit Tests")
class TournamentFormServiceImplTest {

    @Mock
    private CompetitionRepository competitionRepository;

    @Mock
    private ApplicationFormConfigRepository formConfigRepository;

    @Mock
    private SubmittedApplicationFormRepository submittedRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AthleteService athleteService;

    @Mock
    private CompetitionRoleRepository competitionRoleRepository;

    @Mock
    private PerformanceService performanceService;

    @Mock
    private WeightClassRepository weightClassRepository;

    @Mock
    private VovinamFistConfigRepository fistConfigRepository;

    @Mock
    private VovinamFistItemRepository fistItemRepository;

    @Mock
    private MusicIntegratedPerformanceRepository musicRepository;

    @InjectMocks
    private TournamentFormServiceImpl tournamentFormService;

    private Competition testCompetition;
    private CreateFormRequest validRequest;
    private ApplicationFormConfig savedForm;
    private LocalDateTime testEndDate;

    @BeforeEach
    void setUp() {
        testCompetition = new Competition();
        testCompetition.setId("comp-123");
        testCompetition.setName("Test Tournament");

        testEndDate = LocalDateTime.now().plusDays(30);

        validRequest = new CreateFormRequest();
        validRequest.setName("Tournament Registration Form");
        validRequest.setDescription("Registration form for test tournament");
        validRequest.setFormType(ApplicationFormType.COMPETITION_REGISTRATION);
        validRequest.setCompetitionId("comp-123");
        validRequest.setStatus(FormStatus.DRAFT);
        validRequest.setEndDate(testEndDate);

        savedForm = ApplicationFormConfig.builder()
                .id("form-123")
                .name("Tournament Registration Form")
                .description("Registration form for test tournament")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .endDate(testEndDate)
                .fields(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Should successfully create tournament form with valid data")
    void testCreate_WithValidData_ShouldReturnTournamentFormResponse() {
        // Arrange
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(any(ApplicationFormConfig.class)))
                .thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        assertEquals("form-123", response.getId());
        assertEquals("Tournament Registration Form", response.getFormTitle());
        assertEquals("comp-123", response.getCompetitionId());
        assertEquals("Test Tournament", response.getTournamentName());

        verify(competitionRepository, times(1)).findById("comp-123");
        verify(formConfigRepository, times(1)).countByCompetition_Id("comp-123");
        verify(formConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should throw exception when competition not found")
    void testCreate_WhenCompetitionNotFound_ShouldThrowException() {
        // Arrange
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                java.util.NoSuchElementException.class,
                () -> tournamentFormService.create(validRequest)
        );

        verify(competitionRepository, times(1)).findById("comp-123");
        verify(formConfigRepository, never()).countByCompetition_Id(anyString());
        verify(formConfigRepository, never()).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should throw IllegalStateException when form already exists for competition")
    void testCreate_WhenFormAlreadyExists_ShouldThrowIllegalStateException() {
        // Arrange
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(1L); // Form already exists

        // Act & Assert
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> tournamentFormService.create(validRequest)
        );

        assertEquals("A form already exists for competition: comp-123", exception.getMessage());
        verify(competitionRepository, times(1)).findById("comp-123");
        verify(formConfigRepository, times(1)).countByCompetition_Id("comp-123");
        verify(formConfigRepository, never()).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should set default status DRAFT when status is null")
    void testCreate_WithNullStatus_ShouldSetDefaultDraftStatus() {
        // Arrange
        validRequest.setStatus(null);
        savedForm.setStatus(FormStatus.DRAFT);

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getStatus() == FormStatus.DRAFT
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getStatus() == FormStatus.DRAFT
        ));
    }

    @Test
    @DisplayName("Should create form with PUBLISH status when provided")
    void testCreate_WithPublishStatus_ShouldSetPublishStatus() {
        // Arrange
        validRequest.setStatus(FormStatus.PUBLISH);
        savedForm.setStatus(FormStatus.PUBLISH);

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getStatus() == FormStatus.PUBLISH
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getStatus() == FormStatus.PUBLISH
        ));
    }

    @Test
    @DisplayName("Should create form without fields when fields list is null")
    void testCreate_WithNullFields_ShouldCreateFormWithoutFields() {
        // Arrange
        validRequest.setFields(null);

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should create form without fields when fields list is empty")
    void testCreate_WithEmptyFields_ShouldCreateFormWithoutFields() {
        // Arrange
        validRequest.setFields(new ArrayList<>());

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should create form with valid text field")
    void testCreate_WithValidTextField_ShouldIncludeField() {
        // Arrange
        FormFieldUpsert textField = new FormFieldUpsert();
        textField.setLabel("Full Name");
        textField.setName("fullName");
        textField.setFieldType("TEXT");
        textField.setRequired(true);
        textField.setSortOrder(1);

        validRequest.setFields(Arrays.asList(textField));

        savedForm.setFields(new ArrayList<>());

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("Full Name")
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1
        ));
    }

    @Test
    @DisplayName("Should skip field with empty label")
    void testCreate_WithEmptyLabelField_ShouldSkipField() {
        // Arrange
        FormFieldUpsert invalidField = new FormFieldUpsert();
        invalidField.setLabel(""); // Empty label
        invalidField.setName("invalidField");
        invalidField.setFieldType("TEXT");

        validRequest.setFields(Arrays.asList(invalidField));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should skip field with null label")
    void testCreate_WithNullLabelField_ShouldSkipField() {
        // Arrange
        FormFieldUpsert invalidField = new FormFieldUpsert();
        invalidField.setLabel(null); // Null label
        invalidField.setName("invalidField");
        invalidField.setFieldType("TEXT");

        validRequest.setFields(Arrays.asList(invalidField));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should skip SELECT field without options")
    void testCreate_WithSelectFieldWithoutOptions_ShouldSkipField() {
        // Arrange
        FormFieldUpsert selectField = new FormFieldUpsert();
        selectField.setLabel("Gender");
        selectField.setName("gender");
        selectField.setFieldType("SELECT");
        selectField.setOptions(null); // No options

        validRequest.setFields(Arrays.asList(selectField));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should skip SELECT field with empty options")
    void testCreate_WithSelectFieldWithEmptyOptions_ShouldSkipField() {
        // Arrange
        FormFieldUpsert selectField = new FormFieldUpsert();
        selectField.setLabel("Gender");
        selectField.setName("gender");
        selectField.setFieldType("SELECT");
        selectField.setOptions(""); // Empty options

        validRequest.setFields(Arrays.asList(selectField));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should skip SELECT field with empty array options")
    void testCreate_WithSelectFieldWithEmptyArrayOptions_ShouldSkipField() {
        // Arrange
        FormFieldUpsert selectField = new FormFieldUpsert();
        selectField.setLabel("Gender");
        selectField.setName("gender");
        selectField.setFieldType("SELECT");
        selectField.setOptions("[]"); // Empty array

        validRequest.setFields(Arrays.asList(selectField));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should create form with valid SELECT field with options")
    void testCreate_WithValidSelectField_ShouldIncludeField() {
        // Arrange
        FormFieldUpsert selectField = new FormFieldUpsert();
        selectField.setLabel("Gender");
        selectField.setName("gender");
        selectField.setFieldType("SELECT");
        selectField.setOptions("[\"Male\", \"Female\"]");
        selectField.setRequired(true);
        selectField.setSortOrder(2);

        validRequest.setFields(Arrays.asList(selectField));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getFieldType().equals("SELECT")
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1
        ));
    }

    @Test
    @DisplayName("Should skip DROPDOWN field without options")
    void testCreate_WithDropdownFieldWithoutOptions_ShouldSkipField() {
        // Arrange
        FormFieldUpsert dropdownField = new FormFieldUpsert();
        dropdownField.setLabel("Category");
        dropdownField.setName("category");
        dropdownField.setFieldType("DROPDOWN");
        dropdownField.setOptions(null);

        validRequest.setFields(Arrays.asList(dropdownField));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should set default required=true when required is null")
    void testCreate_WithNullRequiredField_ShouldSetDefaultTrue() {
        // Arrange
        FormFieldUpsert field = new FormFieldUpsert();
        field.setLabel("Email");
        field.setName("email");
        field.setFieldType("TEXT");
        field.setRequired(null); // Null required

        validRequest.setFields(Arrays.asList(field));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getRequired() == Boolean.TRUE
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields().get(0).getRequired() == Boolean.TRUE
        ));
    }

    @Test
    @DisplayName("Should set default sortOrder=0 when sortOrder is null")
    void testCreate_WithNullSortOrder_ShouldSetDefaultZero() {
        // Arrange
        FormFieldUpsert field = new FormFieldUpsert();
        field.setLabel("Phone");
        field.setName("phone");
        field.setFieldType("TEXT");
        field.setSortOrder(null); // Null sortOrder

        validRequest.setFields(Arrays.asList(field));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getSortOrder() == 0
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields().get(0).getSortOrder() == 0
        ));
    }

    @Test
    @DisplayName("Should create form with multiple valid fields")
    void testCreate_WithMultipleValidFields_ShouldIncludeAllFields() {
        // Arrange
        FormFieldUpsert field1 = new FormFieldUpsert();
        field1.setLabel("Full Name");
        field1.setName("fullName");
        field1.setFieldType("TEXT");
        field1.setRequired(true);
        field1.setSortOrder(1);

        FormFieldUpsert field2 = new FormFieldUpsert();
        field2.setLabel("Email");
        field2.setName("email");
        field2.setFieldType("TEXT");
        field2.setRequired(true);
        field2.setSortOrder(2);

        FormFieldUpsert field3 = new FormFieldUpsert();
        field3.setLabel("Gender");
        field3.setName("gender");
        field3.setFieldType("SELECT");
        field3.setOptions("[\"Male\", \"Female\"]");
        field3.setRequired(true);
        field3.setSortOrder(3);

        validRequest.setFields(Arrays.asList(field1, field2, field3));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 3
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 3
        ));
    }

    @Test
    @DisplayName("Should filter out invalid fields and keep valid ones")
    void testCreate_WithMixedValidAndInvalidFields_ShouldFilterInvalid() {
        // Arrange
        FormFieldUpsert validField = new FormFieldUpsert();
        validField.setLabel("Full Name");
        validField.setName("fullName");
        validField.setFieldType("TEXT");
        validField.setRequired(true);

        FormFieldUpsert invalidField1 = new FormFieldUpsert();
        invalidField1.setLabel(""); // Empty label
        invalidField1.setName("invalid1");
        invalidField1.setFieldType("TEXT");

        FormFieldUpsert invalidField2 = new FormFieldUpsert();
        invalidField2.setLabel("Select Field");
        invalidField2.setName("select");
        invalidField2.setFieldType("SELECT");
        invalidField2.setOptions(null); // No options for SELECT

        validRequest.setFields(Arrays.asList(validField, invalidField1, invalidField2));

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("Full Name")
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1
        ));
    }

    @Test
    @DisplayName("Should create form with endDate when provided")
    void testCreate_WithEndDate_ShouldSetEndDate() {
        // Arrange
        LocalDateTime endDate = LocalDateTime.now().plusDays(30);
        validRequest.setEndDate(endDate);
        savedForm.setEndDate(endDate);

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getEndDate() != null && form.getEndDate().equals(endDate)
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getEndDate() != null
        ));
    }

    @Test
    @DisplayName("Should create form with null endDate when not provided")
    void testCreate_WithNullEndDate_ShouldSetNullEndDate() {
        // Arrange
        validRequest.setEndDate(null);

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getEndDate() == null
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getEndDate() == null
        ));
    }

    @Test
    @DisplayName("Should handle all field types requiring options")
    void testCreate_WithAllFieldTypesRequiringOptions_ShouldValidate() {
        // Test SELECT, DROPDOWN, RADIO, CHECKBOX, MULTIPLE-CHOICE
        String[] fieldTypes = {"SELECT", "DROPDOWN", "RADIO", "CHECKBOX", "MULTIPLE-CHOICE"};

        for (String fieldType : fieldTypes) {
            // Arrange
            FormFieldUpsert field = new FormFieldUpsert();
            field.setLabel("Test Field");
            field.setName("testField");
            field.setFieldType(fieldType);
            field.setOptions(null); // No options

            CreateFormRequest request = new CreateFormRequest();
            request.setName("Test Form");
            request.setFormType(ApplicationFormType.COMPETITION_REGISTRATION);
            request.setCompetitionId("comp-123");
            request.setFields(Arrays.asList(field));

            when(competitionRepository.findById("comp-123"))
                    .thenReturn(Optional.of(testCompetition));
            when(formConfigRepository.countByCompetition_Id("comp-123"))
                    .thenReturn(0L);
            when(formConfigRepository.save(argThat(form ->
                    form.getFields() == null || form.getFields().isEmpty()
            ))).thenReturn(savedForm);
            when(submittedRepository.countByFormId(anyString()))
                    .thenReturn(0L);

            // Act
            TournamentFormResponse response = tournamentFormService.create(request);

            // Assert
            assertNotNull(response);
            verify(formConfigRepository, atLeastOnce()).save(argThat(form ->
                    form.getFields() == null || form.getFields().isEmpty()
            ));
            // Reset mocks for next iteration
            reset(formConfigRepository);
            reset(competitionRepository);
            reset(submittedRepository);
        }
    }

    @Test
    @DisplayName("Should create form with CLUB_REGISTRATION form type")
    void testCreate_WithClubRegistrationType_ShouldSetCorrectType() {
        // Arrange
        validRequest.setFormType(ApplicationFormType.CLUB_REGISTRATION);
        savedForm.setFormType(ApplicationFormType.CLUB_REGISTRATION);

        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(formConfigRepository.countByCompetition_Id("comp-123"))
                .thenReturn(0L);
        when(formConfigRepository.save(argThat(form ->
                form.getFormType() == ApplicationFormType.CLUB_REGISTRATION
        ))).thenReturn(savedForm);
        when(submittedRepository.countByFormId(anyString()))
                .thenReturn(0L);

        // Act
        TournamentFormResponse response = tournamentFormService.create(validRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFormType() == ApplicationFormType.CLUB_REGISTRATION
        ));
    }

    // ==================== UPDATE STATUS / PUBLISH TESTS ====================

    @Test
    @DisplayName("Should successfully publish tournament form from DRAFT status")
    void testUpdateStatus_FromDraftToPublish_ShouldUpdateStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig draftForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.DRAFT)
                .build();

        ApplicationFormConfig publishedForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.PUBLISH)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(draftForm));
        when(formConfigRepository.save(argThat(form ->
                form.getStatus() == FormStatus.PUBLISH
        ))).thenReturn(publishedForm);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Assert
        verify(formConfigRepository, times(1)).findById(formId);
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getStatus() == FormStatus.PUBLISH
        ));
    }

    @Test
    @DisplayName("Should throw exception when form not found")
    void testUpdateStatus_WhenFormNotFound_ShouldThrowException() {
        // Arrange
        String formId = "non-existent-form";
        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                java.util.NoSuchElementException.class,
                () -> tournamentFormService.updateStatus(formId, FormStatus.PUBLISH)
        );

        verify(formConfigRepository, times(1)).findById(formId);
        verify(formConfigRepository, never()).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should update status to ARCHIVED")
    void testUpdateStatus_ToArchived_ShouldUpdateStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.PUBLISH)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(argThat(f ->
                f.getStatus() == FormStatus.ARCHIVED
        ))).thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.ARCHIVED);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(f ->
                f.getStatus() == FormStatus.ARCHIVED
        ));
    }

    @Test
    @DisplayName("Should update status to POSTPONE")
    void testUpdateStatus_ToPostpone_ShouldUpdateStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.PUBLISH)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(argThat(f ->
                f.getStatus() == FormStatus.POSTPONE
        ))).thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.POSTPONE);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(f ->
                f.getStatus() == FormStatus.POSTPONE
        ));
    }

    @Test
    @DisplayName("Should update status to DRAFT from PUBLISH")
    void testUpdateStatus_FromPublishToDraft_ShouldUpdateStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.PUBLISH)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(argThat(f ->
                f.getStatus() == FormStatus.DRAFT
        ))).thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.DRAFT);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(f ->
                f.getStatus() == FormStatus.DRAFT
        ));
    }

    @Test
    @DisplayName("Should update status from ARCHIVED to PUBLISH")
    void testUpdateStatus_FromArchivedToPublish_ShouldUpdateStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.ARCHIVED)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(argThat(f ->
                f.getStatus() == FormStatus.PUBLISH
        ))).thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(f ->
                f.getStatus() == FormStatus.PUBLISH
        ));
    }

    @Test
    @DisplayName("Should update status from POSTPONE to PUBLISH")
    void testUpdateStatus_FromPostponeToPublish_ShouldUpdateStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.POSTPONE)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(argThat(f ->
                f.getStatus() == FormStatus.PUBLISH
        ))).thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(f ->
                f.getStatus() == FormStatus.PUBLISH
        ));
    }

    @Test
    @DisplayName("Should update status with all FormStatus values")
    void testUpdateStatus_WithAllStatusValues_ShouldUpdateCorrectly() {
        FormStatus[] allStatuses = {
                FormStatus.DRAFT,
                FormStatus.PUBLISH,
                FormStatus.ARCHIVED,
                FormStatus.POSTPONE
        };

        for (FormStatus status : allStatuses) {
            // Arrange
            String formId = "form-" + status.name();
            ApplicationFormConfig form = ApplicationFormConfig.builder()
                    .id(formId)
                    .name("Test Form")
                    .status(FormStatus.DRAFT)
                    .build();

            when(formConfigRepository.findById(formId))
                    .thenReturn(Optional.of(form));
            when(formConfigRepository.save(argThat(f ->
                    f.getStatus() == status
            ))).thenReturn(form);

            // Act
            tournamentFormService.updateStatus(formId, status);

            // Assert
            verify(formConfigRepository, atLeastOnce()).save(argThat(f ->
                    f.getStatus() == status
            ));

            // Reset for next iteration
            reset(formConfigRepository);
        }
    }

    @Test
    @DisplayName("Should save form after updating status")
    void testUpdateStatus_ShouldSaveFormAfterStatusUpdate() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.DRAFT)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(any(ApplicationFormConfig.class)))
                .thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Assert
        verify(formConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should not change other form properties when updating status")
    void testUpdateStatus_ShouldOnlyUpdateStatusNotOtherProperties() {
        // Arrange
        String formId = "form-123";
        String formName = "Test Form";
        String formDescription = "Test Description";
        ApplicationFormType formType = ApplicationFormType.COMPETITION_REGISTRATION;

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name(formName)
                .description(formDescription)
                .formType(formType)
                .status(FormStatus.DRAFT)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(argThat(f ->
                f.getName().equals(formName) &&
                f.getDescription().equals(formDescription) &&
                f.getFormType() == formType &&
                f.getStatus() == FormStatus.PUBLISH
        ))).thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(f ->
                f.getName().equals(formName) &&
                f.getDescription().equals(formDescription) &&
                f.getFormType() == formType &&
                f.getStatus() == FormStatus.PUBLISH
        ));
    }

    @Test
    @DisplayName("Should handle publishing form multiple times")
    void testUpdateStatus_PublishMultipleTimes_ShouldHandleCorrectly() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.DRAFT)
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(any(ApplicationFormConfig.class)))
                .thenReturn(form);

        // Act - Publish first time
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Change status to DRAFT for second publish
        form.setStatus(FormStatus.DRAFT);
        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));

        // Act - Publish second time
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Assert
        verify(formConfigRepository, times(2)).findById(formId);
        verify(formConfigRepository, times(2)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should handle status update with null status in repository")
    void testUpdateStatus_WithNullStatusInRepository_ShouldSetNewStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(null) // Null status initially
                .build();

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(formConfigRepository.save(argThat(f ->
                f.getStatus() == FormStatus.PUBLISH
        ))).thenReturn(form);

        // Act
        tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(f ->
                f.getStatus() == FormStatus.PUBLISH
        ));
    }

    @Test
    @DisplayName("Should update status from any status to PUBLISH")
    void testUpdateStatus_FromAnyStatusToPublish_ShouldUpdate() {
        FormStatus[] sourceStatuses = {
                FormStatus.DRAFT,
                FormStatus.ARCHIVED,
                FormStatus.POSTPONE
        };

        for (FormStatus sourceStatus : sourceStatuses) {
            // Arrange
            String formId = "form-" + sourceStatus.name();
            ApplicationFormConfig form = ApplicationFormConfig.builder()
                    .id(formId)
                    .name("Test Form")
                    .status(sourceStatus)
                    .build();

            when(formConfigRepository.findById(formId))
                    .thenReturn(Optional.of(form));
            when(formConfigRepository.save(argThat(f ->
                    f.getStatus() == FormStatus.PUBLISH
            ))).thenReturn(form);

            // Act
            tournamentFormService.updateStatus(formId, FormStatus.PUBLISH);

            // Assert
            verify(formConfigRepository, atLeastOnce()).save(argThat(f ->
                    f.getStatus() == FormStatus.PUBLISH
            ));

            // Reset for next iteration
            reset(formConfigRepository);
        }
    }

    @Test
    @DisplayName("Should update status from PUBLISH to any other status")
    void testUpdateStatus_FromPublishToAnyStatus_ShouldUpdate() {
        FormStatus[] targetStatuses = {
                FormStatus.DRAFT,
                FormStatus.ARCHIVED,
                FormStatus.POSTPONE
        };

        for (FormStatus targetStatus : targetStatuses) {
            // Arrange
            String formId = "form-" + targetStatus.name();
            ApplicationFormConfig form = ApplicationFormConfig.builder()
                    .id(formId)
                    .name("Test Form")
                    .status(FormStatus.PUBLISH)
                    .build();

            when(formConfigRepository.findById(formId))
                    .thenReturn(Optional.of(form));
            when(formConfigRepository.save(argThat(f ->
                    f.getStatus() == targetStatus
            ))).thenReturn(form);

            // Act
            tournamentFormService.updateStatus(formId, targetStatus);

            // Assert
            verify(formConfigRepository, atLeastOnce()).save(argThat(f ->
                    f.getStatus() == targetStatus
            ));

            // Reset for next iteration
            reset(formConfigRepository);
        }
    }

    // ==================== UPDATE FORM TESTS ====================

    @Test
    @DisplayName("Should successfully update tournament form with all fields")
    void testUpdate_WithAllFields_ShouldUpdateSuccessfully() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Old Name")
                .description("Old Description")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setName("Updated Name");
        updateRequest.setDescription("Updated Description");
        updateRequest.setFormType(ApplicationFormType.CLUB_REGISTRATION);
        updateRequest.setStatus(FormStatus.PUBLISH);
        updateRequest.setEndDate(testEndDate);

        ApplicationFormConfig updatedForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Updated Name")
                .description("Updated Description")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(testEndDate)
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(any(ApplicationFormConfig.class)))
                .thenReturn(updatedForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(updatedForm));

        // Act
        FormDetailResponse response = tournamentFormService.update(formId, updateRequest);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, atLeastOnce()).findWithFieldsById(formId);
        verify(formConfigRepository, times(1)).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should throw exception when form not found")
    void testUpdate_WhenFormNotFound_ShouldThrowException() {
        // Arrange
        String formId = "non-existent-form";
        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setName("Updated Name");

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                java.util.NoSuchElementException.class,
                () -> tournamentFormService.update(formId, updateRequest)
        );

        verify(formConfigRepository, times(1)).findWithFieldsById(formId);
        verify(formConfigRepository, never()).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should update only name when only name is provided")
    void testUpdate_WithOnlyName_ShouldUpdateOnlyName() {
        // Arrange
        String formId = "form-123";
        String originalDescription = "Original Description";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Original Name")
                .description(originalDescription)
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setName("Updated Name");

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getName().equals("Updated Name") &&
                form.getDescription().equals(originalDescription)
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getName().equals("Updated Name") &&
                form.getDescription().equals(originalDescription)
        ));
    }

    @Test
    @DisplayName("Should update only description when only description is provided")
    void testUpdate_WithOnlyDescription_ShouldUpdateOnlyDescription() {
        // Arrange
        String formId = "form-123";
        String originalName = "Original Name";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name(originalName)
                .description("Original Description")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setDescription("Updated Description");

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getName().equals(originalName) &&
                form.getDescription().equals("Updated Description")
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getDescription().equals("Updated Description")
        ));
    }

    @Test
    @DisplayName("Should update competition when competitionId is provided")
    void testUpdate_WithCompetitionId_ShouldUpdateCompetition() {
        // Arrange
        String formId = "form-123";
        Competition newCompetition = new Competition();
        newCompetition.setId("comp-456");
        newCompetition.setName("New Tournament");

        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .competition(testCompetition)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setCompetitionId("comp-456");

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(competitionRepository.findById("comp-456"))
                .thenReturn(Optional.of(newCompetition));
        when(formConfigRepository.save(argThat(form ->
                form.getCompetition() != null && form.getCompetition().getId().equals("comp-456")
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(competitionRepository, times(1)).findById("comp-456");
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getCompetition().getId().equals("comp-456")
        ));
    }

    @Test
    @DisplayName("Should throw exception when competition not found")
    void testUpdate_WhenCompetitionNotFound_ShouldThrowException() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setCompetitionId("non-existent-comp");

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(competitionRepository.findById("non-existent-comp"))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
                java.util.NoSuchElementException.class,
                () -> tournamentFormService.update(formId, updateRequest)
        );

        verify(competitionRepository, times(1)).findById("non-existent-comp");
        verify(formConfigRepository, never()).save(any(ApplicationFormConfig.class));
    }

    @Test
    @DisplayName("Should add new field when updating with new field")
    void testUpdate_WithNewField_ShouldAddField() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert newField = new FormFieldUpsert();
        newField.setLabel("Email");
        newField.setName("email");
        newField.setFieldType("TEXT");
        newField.setRequired(true);
        newField.setSortOrder(1);

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(newField));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("Email")
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1
        ));
    }

    @Test
    @DisplayName("Should update existing field when field ID is provided")
    void testUpdate_WithExistingFieldId_ShouldUpdateField() {
        // Arrange
        String formId = "form-123";
        String fieldId = "field-123";
        ApplicationFormField existingField = ApplicationFormField.builder()
                .id(fieldId)
                .label("Old Label")
                .name("oldName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>(Arrays.asList(existingField)))
                .build();

        FormFieldUpsert updatedField = new FormFieldUpsert();
        updatedField.setId(fieldId);
        updatedField.setLabel("Updated Label");
        updatedField.setName("updatedName");
        updatedField.setFieldType("TEXT");
        updatedField.setRequired(false);
        updatedField.setSortOrder(2);

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(updatedField));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("Updated Label") &&
                form.getFields().get(0).getId().equals(fieldId)
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("Updated Label")
        ));
    }

    @Test
    @DisplayName("Should remove all fields when empty fields list is provided")
    void testUpdate_WithEmptyFieldsList_ShouldRemoveAllFields() {
        // Arrange
        String formId = "form-123";
        ApplicationFormField field1 = ApplicationFormField.builder()
                .id("field-1")
                .label("Field 1")
                .fieldType("TEXT")
                .build();
        ApplicationFormField field2 = ApplicationFormField.builder()
                .id("field-2")
                .label("Field 2")
                .fieldType("TEXT")
                .build();

        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>(Arrays.asList(field1, field2)))
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(new ArrayList<>());

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should skip field with empty label")
    void testUpdate_WithEmptyLabelField_ShouldSkipField() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert invalidField = new FormFieldUpsert();
        invalidField.setLabel(""); // Empty label
        invalidField.setName("invalidField");
        invalidField.setFieldType("TEXT");

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(invalidField));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should skip SELECT field without options")
    void testUpdate_WithSelectFieldWithoutOptions_ShouldSkipField() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert selectField = new FormFieldUpsert();
        selectField.setLabel("Gender");
        selectField.setName("gender");
        selectField.setFieldType("SELECT");
        selectField.setOptions(null); // No options

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(selectField));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() == null || form.getFields().isEmpty()
        ));
    }

    @Test
    @DisplayName("Should update with valid SELECT field with options")
    void testUpdate_WithValidSelectField_ShouldIncludeField() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert selectField = new FormFieldUpsert();
        selectField.setLabel("Gender");
        selectField.setName("gender");
        selectField.setFieldType("SELECT");
        selectField.setOptions("[\"Male\", \"Female\"]");
        selectField.setRequired(true);
        selectField.setSortOrder(1);

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(selectField));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getFieldType().equals("SELECT")
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1
        ));
    }

    @Test
    @DisplayName("Should set default required=true when required is null")
    void testUpdate_WithNullRequired_ShouldSetDefaultTrue() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert field = new FormFieldUpsert();
        field.setLabel("Email");
        field.setName("email");
        field.setFieldType("TEXT");
        field.setRequired(null); // Null required

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(field));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getRequired() == Boolean.TRUE
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields().get(0).getRequired() == Boolean.TRUE
        ));
    }

    @Test
    @DisplayName("Should set default sortOrder=0 when sortOrder is null")
    void testUpdate_WithNullSortOrder_ShouldSetDefaultZero() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert field = new FormFieldUpsert();
        field.setLabel("Phone");
        field.setName("phone");
        field.setFieldType("TEXT");
        field.setSortOrder(null); // Null sortOrder

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(field));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getSortOrder() == 0
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields().get(0).getSortOrder() == 0
        ));
    }

    @Test
    @DisplayName("Should update multiple fields at once")
    void testUpdate_WithMultipleFields_ShouldUpdateAllFields() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert field1 = new FormFieldUpsert();
        field1.setLabel("Full Name");
        field1.setName("fullName");
        field1.setFieldType("TEXT");
        field1.setRequired(true);
        field1.setSortOrder(1);

        FormFieldUpsert field2 = new FormFieldUpsert();
        field2.setLabel("Email");
        field2.setName("email");
        field2.setFieldType("TEXT");
        field2.setRequired(true);
        field2.setSortOrder(2);

        FormFieldUpsert field3 = new FormFieldUpsert();
        field3.setLabel("Gender");
        field3.setName("gender");
        field3.setFieldType("SELECT");
        field3.setOptions("[\"Male\", \"Female\"]");
        field3.setRequired(true);
        field3.setSortOrder(3);

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(field1, field2, field3));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 3
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 3
        ));
    }

    @Test
    @DisplayName("Should replace existing fields with new fields")
    void testUpdate_WithNewFields_ShouldReplaceExistingFields() {
        // Arrange
        String formId = "form-123";
        ApplicationFormField oldField = ApplicationFormField.builder()
                .id("field-1")
                .label("Old Field")
                .fieldType("TEXT")
                .build();

        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>(Arrays.asList(oldField)))
                .build();

        FormFieldUpsert newField = new FormFieldUpsert();
        newField.setLabel("New Field");
        newField.setName("newField");
        newField.setFieldType("TEXT");
        newField.setRequired(true);
        newField.setSortOrder(1);

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(newField));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("New Field")
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("New Field")
        ));
    }

    @Test
    @DisplayName("Should not update fields when fields is null")
    void testUpdate_WithNullFields_ShouldNotUpdateFields() {
        // Arrange
        String formId = "form-123";
        ApplicationFormField existingField = ApplicationFormField.builder()
                .id("field-1")
                .label("Existing Field")
                .fieldType("TEXT")
                .build();

        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>(Arrays.asList(existingField)))
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setName("Updated Name");
        updateRequest.setFields(null); // Null fields

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getName().equals("Updated Name") &&
                form.getFields() != null && form.getFields().size() == 1
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1
        ));
    }

    @Test
    @DisplayName("Should update endDate when provided")
    void testUpdate_WithEndDate_ShouldUpdateEndDate() {
        // Arrange
        String formId = "form-123";
        LocalDateTime newEndDate = LocalDateTime.now().plusDays(60);
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .endDate(testEndDate)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setEndDate(newEndDate);

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getEndDate() != null && form.getEndDate().equals(newEndDate)
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getEndDate() != null && form.getEndDate().equals(newEndDate)
        ));
    }

    @Test
    @DisplayName("Should update status when provided")
    void testUpdate_WithStatus_ShouldUpdateStatus() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setStatus(FormStatus.PUBLISH);

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getStatus() == FormStatus.PUBLISH
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getStatus() == FormStatus.PUBLISH
        ));
    }

    @Test
    @DisplayName("Should update formType when provided")
    void testUpdate_WithFormType_ShouldUpdateFormType() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFormType(ApplicationFormType.CLUB_REGISTRATION);

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFormType() == ApplicationFormType.CLUB_REGISTRATION
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFormType() == ApplicationFormType.CLUB_REGISTRATION
        ));
    }

    @Test
    @DisplayName("Should filter out invalid fields and keep valid ones")
    void testUpdate_WithMixedValidAndInvalidFields_ShouldFilterInvalid() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .fields(new ArrayList<>())
                .build();

        FormFieldUpsert validField = new FormFieldUpsert();
        validField.setLabel("Full Name");
        validField.setName("fullName");
        validField.setFieldType("TEXT");
        validField.setRequired(true);

        FormFieldUpsert invalidField1 = new FormFieldUpsert();
        invalidField1.setLabel(""); // Empty label
        invalidField1.setName("invalid1");
        invalidField1.setFieldType("TEXT");

        FormFieldUpsert invalidField2 = new FormFieldUpsert();
        invalidField2.setLabel("Select Field");
        invalidField2.setName("select");
        invalidField2.setFieldType("SELECT");
        invalidField2.setOptions(null); // No options for SELECT

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setFields(Arrays.asList(validField, invalidField1, invalidField2));

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1 &&
                form.getFields().get(0).getLabel().equals("Full Name")
        ))).thenReturn(existingForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));

        // Act
        tournamentFormService.update(formId, updateRequest);

        // Assert
        verify(formConfigRepository, times(1)).save(argThat(form ->
                form.getFields() != null && form.getFields().size() == 1
        ));
    }

    @Test
    @DisplayName("Should return FormDetailResponse after update")
    void testUpdate_ShouldReturnFormDetailResponse() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig existingForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Test Form")
                .description("Test Description")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        UpdateFormRequest updateRequest = new UpdateFormRequest();
        updateRequest.setName("Updated Name");

        ApplicationFormConfig updatedForm = ApplicationFormConfig.builder()
                .id(formId)
                .name("Updated Name")
                .description("Test Description")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(existingForm));
        when(formConfigRepository.save(any(ApplicationFormConfig.class)))
                .thenReturn(updatedForm);
        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(updatedForm));

        // Act
        FormDetailResponse response = tournamentFormService.update(formId, updateRequest);

        // Assert
        assertNotNull(response);
        assertEquals("Updated Name", response.getName());
        verify(formConfigRepository, atLeastOnce()).findWithFieldsById(formId);
    }

    // ==================== LIST FORM TESTS ====================

    @Test
    @DisplayName("Should successfully list tournament forms with default parameters")
    void testList_WithDefaultParameters_ShouldReturnPaginatedResponse() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .sortBy("createdAt")
                .sortDirection("desc")
                .build();

        ApplicationFormConfig form1 = ApplicationFormConfig.builder()
                .id("form-1")
                .name("Form 1")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        ApplicationFormConfig form2 = ApplicationFormConfig.builder()
                .id("form-2")
                .name("Form 2")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(form1, form2);
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 2);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-1"))
                .thenReturn(5L);
        when(submittedRepository.countByFormId("form-2"))
                .thenReturn(10L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getContent().size());
        assertEquals(0, response.getPage());
        assertEquals(10, response.getSize());
        assertEquals(2, response.getTotalElements());
        assertEquals(1, response.getTotalPages());
        assertTrue(response.isFirst());
        assertTrue(response.isLast());
        assertFalse(response.isHasNext());
        assertFalse(response.isHasPrevious());

        verify(formConfigRepository, times(1)).search(eq(null), any(Pageable.class));
        verify(submittedRepository, times(2)).countByFormId(anyString());
    }

    @Test
    @DisplayName("Should list tournament forms with search keyword")
    void testList_WithSearchKeyword_ShouldFilterResults() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .sortBy("name")
                .sortDirection("asc")
                .search("tournament")
                .build();

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id("form-1")
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(form);
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 1);

        when(formConfigRepository.search(eq("%tournament%"), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-1"))
                .thenReturn(3L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("form-1", response.getContent().get(0).getId());
        verify(formConfigRepository, times(1)).search(eq("%tournament%"), any(Pageable.class));
    }

    @Test
    @DisplayName("Should convert search keyword to lowercase with wildcards")
    void testList_WithSearchKeyword_ShouldFormatCorrectly() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .search("TOURNAMENT FORM")
                .build();

        Page<ApplicationFormConfig> emptyPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(10), 0);

        when(formConfigRepository.search(eq("%tournament form%"), any(Pageable.class)))
                .thenReturn(emptyPage);

        // Act
        tournamentFormService.list(params);

        // Assert
        verify(formConfigRepository, times(1)).search(eq("%tournament form%"), any(Pageable.class));
    }

    @Test
    @DisplayName("Should handle empty search results")
    void testList_WithNoResults_ShouldReturnEmptyResponse() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .build();

        Page<ApplicationFormConfig> emptyPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(10), 0);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(emptyPage);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertTrue(response.getContent().isEmpty());
        assertEquals(0, response.getTotalElements());
        assertEquals(0, response.getTotalPages());
        verify(formConfigRepository, times(1)).search(eq(null), any(Pageable.class));
    }

    @Test
    @DisplayName("Should list forms with ascending sort")
    void testList_WithAscendingSort_ShouldSortAscending() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .sortBy("name")
                .sortDirection("asc")
                .build();

        Page<ApplicationFormConfig> formPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(10), 0);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);

        // Act
        tournamentFormService.list(params);

        // Assert
        verify(formConfigRepository, times(1)).search(eq(null), argThat(pageable ->
                pageable.getSort().getOrderFor("name") != null &&
                pageable.getSort().getOrderFor("name").getDirection().isAscending()
        ));
    }

    @Test
    @DisplayName("Should list forms with descending sort")
    void testList_WithDescendingSort_ShouldSortDescending() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .sortBy("createdAt")
                .sortDirection("desc")
                .build();

        Page<ApplicationFormConfig> formPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(10), 0);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);

        // Act
        tournamentFormService.list(params);

        // Assert
        verify(formConfigRepository, times(1)).search(eq(null), argThat(pageable ->
                pageable.getSort().getOrderFor("createdAt") != null &&
                pageable.getSort().getOrderFor("createdAt").getDirection().isDescending()
        ));
    }

    @Test
    @DisplayName("Should list forms with custom page number")
    void testList_WithCustomPage_ShouldReturnCorrectPage() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(2)
                .size(10)
                .build();

        Page<ApplicationFormConfig> formPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(10), 0);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        verify(formConfigRepository, times(1)).search(eq(null), argThat(pageable ->
                pageable.getPageNumber() == 2
        ));
    }

    @Test
    @DisplayName("Should list forms with custom page size")
    void testList_WithCustomPageSize_ShouldUseCorrectSize() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(20)
                .build();

        Page<ApplicationFormConfig> formPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(20), 0);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(20, response.getSize());
        verify(formConfigRepository, times(1)).search(eq(null), argThat(pageable ->
                pageable.getPageSize() == 20
        ));
    }

    @Test
    @DisplayName("Should map forms to TournamentFormResponse correctly")
    void testList_ShouldMapFormsToResponse() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .build();

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id("form-123")
                .name("Tournament Registration Form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(form);
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 1);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-123"))
                .thenReturn(15L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        TournamentFormResponse formResponse = response.getContent().get(0);
        assertEquals("form-123", formResponse.getId());
        assertEquals("Tournament Registration Form", formResponse.getFormTitle());
        assertEquals("comp-123", formResponse.getCompetitionId());
        assertEquals("Test Tournament", formResponse.getTournamentName());
        assertEquals(15, formResponse.getNumberOfParticipants());
    }

    @Test
    @DisplayName("Should handle forms with null competition")
    void testList_WithNullCompetition_ShouldHandleGracefully() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .build();

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id("form-123")
                .name("Form Without Competition")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(null) // Null competition
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(form);
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 1);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-123"))
                .thenReturn(0L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        TournamentFormResponse formResponse = response.getContent().get(0);
        assertNull(formResponse.getCompetitionId());
        assertNull(formResponse.getTournamentName());
    }

    @Test
    @DisplayName("Should handle pagination with multiple pages")
    void testList_WithMultiplePages_ShouldReturnCorrectPagination() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(1)
                .size(5)
                .build();

        // Create 15 forms for 3 pages (5 per page)
        List<ApplicationFormConfig> forms = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            ApplicationFormConfig form = ApplicationFormConfig.builder()
                    .id("form-" + i)
                    .name("Form " + i)
                    .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                    .competition(testCompetition)
                    .status(FormStatus.DRAFT)
                    .fields(new ArrayList<>())
                    .build();
            forms.add(form);
        }

        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(5).withPage(1), 15);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        for (int i = 0; i < 5; i++) {
            when(submittedRepository.countByFormId("form-" + i))
                    .thenReturn(0L);
        }

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(5, response.getContent().size());
        assertEquals(1, response.getPage());
        assertEquals(5, response.getSize());
        assertEquals(15, response.getTotalElements());
        assertEquals(3, response.getTotalPages());
        assertFalse(response.isFirst());
        assertFalse(response.isLast());
        assertTrue(response.isHasNext());
        assertTrue(response.isHasPrevious());
    }

    @Test
    @DisplayName("Should handle search with empty string")
    void testList_WithEmptySearch_ShouldNotAddWildcards() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .search("   ") // Empty/whitespace only
                .build();

        Page<ApplicationFormConfig> formPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(10), 0);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);

        // Act
        tournamentFormService.list(params);

        // Assert
        // Empty search should be treated as no search
        verify(formConfigRepository, times(1)).search(eq(null), any(Pageable.class));
    }

    @Test
    @DisplayName("Should handle different sortBy fields")
    void testList_WithDifferentSortByFields_ShouldSortCorrectly() {
        String[] sortFields = {"name", "createdAt", "updatedAt", "status"};

        for (String sortField : sortFields) {
            // Arrange
            RequestParam params = RequestParam.builder()
                    .page(0)
                    .size(10)
                    .sortBy(sortField)
                    .sortDirection("asc")
                    .build();

            Page<ApplicationFormConfig> formPage = new PageImpl<>(new ArrayList<>(), Pageable.ofSize(10), 0);

            when(formConfigRepository.search(eq(null), any(Pageable.class)))
                    .thenReturn(formPage);

            // Act
            tournamentFormService.list(params);

            // Assert
            verify(formConfigRepository, atLeastOnce()).search(eq(null), argThat(pageable ->
                    pageable.getSort().getOrderFor(sortField) != null
            ));

            reset(formConfigRepository);
        }
    }

    @Test
    @DisplayName("Should count participants for each form")
    void testList_ShouldCountParticipantsForEachForm() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .build();

        ApplicationFormConfig form1 = ApplicationFormConfig.builder()
                .id("form-1")
                .name("Form 1")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        ApplicationFormConfig form2 = ApplicationFormConfig.builder()
                .id("form-2")
                .name("Form 2")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(form1, form2);
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 2);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-1"))
                .thenReturn(25L);
        when(submittedRepository.countByFormId("form-2"))
                .thenReturn(50L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getContent().size());
        assertEquals(25, response.getContent().get(0).getNumberOfParticipants());
        assertEquals(50, response.getContent().get(1).getNumberOfParticipants());
        verify(submittedRepository, times(1)).countByFormId("form-1");
        verify(submittedRepository, times(1)).countByFormId("form-2");
    }

    @Test
    @DisplayName("Should handle forms with different statuses")
    void testList_WithDifferentStatuses_ShouldMapCorrectly() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .build();

        ApplicationFormConfig draftForm = ApplicationFormConfig.builder()
                .id("form-draft")
                .name("Draft Form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        ApplicationFormConfig publishForm = ApplicationFormConfig.builder()
                .id("form-publish")
                .name("Publish Form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(draftForm, publishForm);
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 2);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-draft"))
                .thenReturn(0L);
        when(submittedRepository.countByFormId("form-publish"))
                .thenReturn(10L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getContent().size());
        assertEquals("draft", response.getContent().get(0).getStatus());
        assertEquals("publish", response.getContent().get(1).getStatus());
    }

    @Test
    @DisplayName("Should handle forms with different form types")
    void testList_WithDifferentFormTypes_ShouldMapCorrectly() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .build();

        ApplicationFormConfig competitionForm = ApplicationFormConfig.builder()
                .id("form-comp")
                .name("Competition Form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        ApplicationFormConfig clubForm = ApplicationFormConfig.builder()
                .id("form-club")
                .name("Club Form")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(competitionForm, clubForm);
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 2);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-comp"))
                .thenReturn(5L);
        when(submittedRepository.countByFormId("form-club"))
                .thenReturn(8L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getContent().size());
        assertEquals("COMPETITION_REGISTRATION", response.getContent().get(0).getFormType());
        assertEquals("CLUB_REGISTRATION", response.getContent().get(1).getFormType());
    }

    @Test
    @DisplayName("Should handle last page correctly")
    void testList_OnLastPage_ShouldSetLastFlag() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(2)
                .size(5)
                .build();

        List<ApplicationFormConfig> forms = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            ApplicationFormConfig form = ApplicationFormConfig.builder()
                    .id("form-" + i)
                    .name("Form " + i)
                    .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                    .competition(testCompetition)
                    .status(FormStatus.DRAFT)
                    .fields(new ArrayList<>())
                    .build();
            forms.add(form);
        }

        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(5).withPage(2), 13);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        for (int i = 0; i < 3; i++) {
            when(submittedRepository.countByFormId("form-" + i))
                    .thenReturn(0L);
        }

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getPage());
        assertTrue(response.isLast());
        assertFalse(response.isHasNext());
        assertTrue(response.isHasPrevious());
    }

    @Test
    @DisplayName("Should handle first page correctly")
    void testList_OnFirstPage_ShouldSetFirstFlag() {
        // Arrange
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .build();

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id("form-1")
                .name("Form 1")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        List<ApplicationFormConfig> forms = Arrays.asList(form);
        // Create page with 1 form out of 15 total (multiple pages scenario)
        Page<ApplicationFormConfig> formPage = new PageImpl<>(forms, Pageable.ofSize(10), 15);

        when(formConfigRepository.search(eq(null), any(Pageable.class)))
                .thenReturn(formPage);
        when(submittedRepository.countByFormId("form-1"))
                .thenReturn(0L);

        // Act
        PaginationResponse<TournamentFormResponse> response = tournamentFormService.list(params);

        // Assert
        assertNotNull(response);
        assertEquals(0, response.getPage());
        assertTrue(response.isFirst());
        assertFalse(response.isHasPrevious());
        assertTrue(response.isHasNext());
    }

    // ==================== GET BY ID (VIEW FORM RESULT) TESTS ====================

    @Test
    @DisplayName("Should successfully get tournament form by id with fields")
    void testGetById_WithFields_ShouldReturnFormDetail() {
        // Arrange
        String formId = "form-123";
        
        ApplicationFormField field1 = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .options(null)
                .sortOrder(1)
                .build();

        ApplicationFormField field2 = ApplicationFormField.builder()
                .id("field-2")
                .label("Email")
                .name("email")
                .fieldType("EMAIL")
                .required(true)
                .options(null)
                .sortOrder(2)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(field1, field2);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .description("Registration form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(testEndDate)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals("Tournament Registration", response.getName());
        assertEquals("Registration form", response.getDescription());
        assertEquals(ApplicationFormType.COMPETITION_REGISTRATION, response.getFormType());
        assertEquals("comp-123", response.getCompetitionId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertNotNull(response.getFields());
        assertEquals(2, response.getFields().size());
        assertEquals("Full Name", response.getFields().get(0).getLabel());
        assertEquals("Email", response.getFields().get(1).getLabel());

        verify(formConfigRepository, times(1)).findWithFieldsById(formId);
        verify(formConfigRepository, never()).findById(anyString());
    }

    @Test
    @DisplayName("Should successfully get form when findWithFieldsById returns empty but findById finds it")
    void testGetById_WhenFindWithFieldsEmpty_FallsBackToFindById() {
        // Arrange
        String formId = "form-123";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .description("Registration form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.empty());
        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals("Tournament Registration", response.getName());
        assertEquals(ApplicationFormType.COMPETITION_REGISTRATION, response.getFormType());
        assertNotNull(response.getFields());
        assertTrue(response.getFields().isEmpty());

        verify(formConfigRepository, times(1)).findWithFieldsById(formId);
        verify(formConfigRepository, times(1)).findById(formId);
    }

    @Test
    @DisplayName("Should throw exception when form not found")
    void testGetById_WhenFormNotFound_ShouldThrowException() {
        // Arrange
        String formId = "non-existent-form";

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.empty());
        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(NoSuchElementException.class, () -> {
            tournamentFormService.getById(formId);
        });

        verify(formConfigRepository, times(1)).findWithFieldsById(formId);
        verify(formConfigRepository, times(1)).findById(formId);
    }

    @Test
    @DisplayName("Should filter out fields with empty labels")
    void testGetById_WithInvalidFields_ShouldFilterEmptyLabels() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField validField = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField emptyLabelField = ApplicationFormField.builder()
                .id("field-2")
                .label("   ") // Empty/whitespace label
                .name("email")
                .fieldType("EMAIL")
                .required(true)
                .sortOrder(2)
                .build();

        ApplicationFormField nullLabelField = ApplicationFormField.builder()
                .id("field-3")
                .label(null) // Null label
                .name("phone")
                .fieldType("TEXT")
                .required(false)
                .sortOrder(3)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(validField, emptyLabelField, nullLabelField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getFields().size());
        assertEquals("Full Name", response.getFields().get(0).getLabel());
    }

    @Test
    @DisplayName("Should filter out SELECT fields with empty options")
    void testGetById_WithSelectFieldNoOptions_ShouldFilterOut() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField validField = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField selectFieldNoOptions = ApplicationFormField.builder()
                .id("field-2")
                .label("Gender")
                .name("gender")
                .fieldType("SELECT")
                .required(true)
                .options("") // Empty options
                .sortOrder(2)
                .build();

        ApplicationFormField selectFieldNullOptions = ApplicationFormField.builder()
                .id("field-3")
                .label("Country")
                .name("country")
                .fieldType("SELECT")
                .required(true)
                .options(null) // Null options
                .sortOrder(3)
                .build();

        ApplicationFormField selectFieldEmptyJson = ApplicationFormField.builder()
                .id("field-4")
                .label("State")
                .name("state")
                .fieldType("SELECT")
                .required(true)
                .options("[]") // Empty JSON array
                .sortOrder(4)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(validField, selectFieldNoOptions, selectFieldNullOptions, selectFieldEmptyJson);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getFields().size());
        assertEquals("Full Name", response.getFields().get(0).getLabel());
    }

    @Test
    @DisplayName("Should include SELECT fields with valid options")
    void testGetById_WithSelectFieldValidOptions_ShouldInclude() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField selectField = ApplicationFormField.builder()
                .id("field-1")
                .label("Gender")
                .name("gender")
                .fieldType("SELECT")
                .required(true)
                .options("[\"Male\", \"Female\", \"Other\"]")
                .sortOrder(1)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(selectField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getFields().size());
        assertEquals("Gender", response.getFields().get(0).getLabel());
        assertEquals("SELECT", response.getFields().get(0).getFieldType());
        assertEquals("[\"Male\", \"Female\", \"Other\"]", response.getFields().get(0).getOptions());
    }

    @Test
    @DisplayName("Should filter DROPDOWN fields with empty options")
    void testGetById_WithDropdownFieldNoOptions_ShouldFilterOut() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField dropdownField = ApplicationFormField.builder()
                .id("field-1")
                .label("Category")
                .name("category")
                .fieldType("DROPDOWN")
                .required(true)
                .options("")
                .sortOrder(1)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(dropdownField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertTrue(response.getFields().isEmpty());
    }

    @Test
    @DisplayName("Should filter RADIO fields with empty options")
    void testGetById_WithRadioFieldNoOptions_ShouldFilterOut() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField radioField = ApplicationFormField.builder()
                .id("field-1")
                .label("Experience Level")
                .name("experience")
                .fieldType("RADIO")
                .required(true)
                .options(null)
                .sortOrder(1)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(radioField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertTrue(response.getFields().isEmpty());
    }

    @Test
    @DisplayName("Should filter CHECKBOX fields with empty options")
    void testGetById_WithCheckboxFieldNoOptions_ShouldFilterOut() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField checkboxField = ApplicationFormField.builder()
                .id("field-1")
                .label("Interests")
                .name("interests")
                .fieldType("CHECKBOX")
                .required(true)
                .options("[]")
                .sortOrder(1)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(checkboxField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertTrue(response.getFields().isEmpty());
    }

    @Test
    @DisplayName("Should filter MULTIPLE-CHOICE fields with empty options")
    void testGetById_WithMultipleChoiceFieldNoOptions_ShouldFilterOut() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField multipleChoiceField = ApplicationFormField.builder()
                .id("field-1")
                .label("Skills")
                .name("skills")
                .fieldType("MULTIPLE-CHOICE")
                .required(true)
                .options("   ")
                .sortOrder(1)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(multipleChoiceField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertTrue(response.getFields().isEmpty());
    }

    @Test
    @DisplayName("Should handle form with null competition")
    void testGetById_WithNullCompetition_ShouldReturnNullCompetitionId() {
        // Arrange
        String formId = "form-123";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(null) // Null competition
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertNull(response.getCompetitionId());
    }

    @Test
    @DisplayName("Should handle form with no fields")
    void testGetById_WithNoFields_ShouldReturnEmptyFieldsList() {
        // Arrange
        String formId = "form-123";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(null) // Null fields
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getFields());
        assertTrue(response.getFields().isEmpty());
    }

    @Test
    @DisplayName("Should handle form with empty fields list")
    void testGetById_WithEmptyFieldsList_ShouldReturnEmptyFieldsList() {
        // Arrange
        String formId = "form-123";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(new ArrayList<>()) // Empty fields list
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getFields());
        assertTrue(response.getFields().isEmpty());
    }

    @Test
    @DisplayName("Should include all field types that don't require options")
    void testGetById_WithNonOptionFields_ShouldIncludeAll() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField textField = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField emailField = ApplicationFormField.builder()
                .id("field-2")
                .label("Email")
                .name("email")
                .fieldType("EMAIL")
                .required(true)
                .sortOrder(2)
                .build();

        ApplicationFormField numberField = ApplicationFormField.builder()
                .id("field-3")
                .label("Age")
                .name("age")
                .fieldType("NUMBER")
                .required(false)
                .sortOrder(3)
                .build();

        ApplicationFormField dateField = ApplicationFormField.builder()
                .id("field-4")
                .label("Birth Date")
                .name("birthDate")
                .fieldType("DATE")
                .required(true)
                .sortOrder(4)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(textField, emailField, numberField, dateField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(4, response.getFields().size());
    }

    @Test
    @DisplayName("Should map all field properties correctly")
    void testGetById_ShouldMapFieldPropertiesCorrectly() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField field = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(false)
                .options(null)
                .sortOrder(5)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(field);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getFields().size());
        FormFieldDto fieldDto = response.getFields().get(0);
        assertEquals("field-1", fieldDto.getId());
        assertEquals("Full Name", fieldDto.getLabel());
        assertEquals("fullName", fieldDto.getName());
        assertEquals("TEXT", fieldDto.getFieldType());
        assertEquals(false, fieldDto.getRequired());
        assertNull(fieldDto.getOptions());
        assertEquals(5, fieldDto.getSortOrder());
    }

    @Test
    @DisplayName("Should handle form with mixed valid and invalid fields")
    void testGetById_WithMixedValidInvalidFields_ShouldFilterCorrectly() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField validField1 = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField invalidEmptyLabel = ApplicationFormField.builder()
                .id("field-2")
                .label("")
                .name("email")
                .fieldType("EMAIL")
                .required(true)
                .sortOrder(2)
                .build();

        ApplicationFormField invalidSelectNoOptions = ApplicationFormField.builder()
                .id("field-3")
                .label("Gender")
                .name("gender")
                .fieldType("SELECT")
                .required(true)
                .options("")
                .sortOrder(3)
                .build();

        ApplicationFormField validSelectWithOptions = ApplicationFormField.builder()
                .id("field-4")
                .label("Country")
                .name("country")
                .fieldType("SELECT")
                .required(true)
                .options("[\"USA\", \"Canada\", \"Mexico\"]")
                .sortOrder(4)
                .build();

        ApplicationFormField validField2 = ApplicationFormField.builder()
                .id("field-5")
                .label("Phone")
                .name("phone")
                .fieldType("TEXT")
                .required(false)
                .sortOrder(5)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(
                validField1, invalidEmptyLabel, invalidSelectNoOptions, 
                validSelectWithOptions, validField2
        );

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(3, response.getFields().size()); // Only 3 valid fields
        assertEquals("Full Name", response.getFields().get(0).getLabel());
        assertEquals("Country", response.getFields().get(1).getLabel());
        assertEquals("Phone", response.getFields().get(2).getLabel());
    }

    @Test
    @DisplayName("Should map all form properties correctly")
    void testGetById_ShouldMapFormPropertiesCorrectly() {
        // Arrange
        String formId = "form-123";
        LocalDateTime endDate = LocalDateTime.now().plusDays(30);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .description("Registration form description")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(endDate)
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals("Tournament Registration", response.getName());
        assertEquals("Registration form description", response.getDescription());
        assertEquals(ApplicationFormType.CLUB_REGISTRATION, response.getFormType());
        assertEquals("comp-123", response.getCompetitionId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(endDate, response.getEndDate());
        assertNotNull(response.getCreatedAt()); // createdAt is auto-set by BaseEntity
    }

    @Test
    @DisplayName("Should handle case-insensitive field type matching for option fields")
    void testGetById_WithCaseInsensitiveFieldTypes_ShouldFilterCorrectly() {
        // Arrange
        String formId = "form-123";

        ApplicationFormField selectLowercase = ApplicationFormField.builder()
                .id("field-1")
                .label("Option 1")
                .name("option1")
                .fieldType("select") // lowercase
                .required(true)
                .options("[\"A\", \"B\"]")
                .sortOrder(1)
                .build();

        ApplicationFormField dropdownUppercase = ApplicationFormField.builder()
                .id("field-2")
                .label("Option 2")
                .name("option2")
                .fieldType("DROPDOWN") // uppercase
                .required(true)
                .options("")
                .sortOrder(2)
                .build();

        ApplicationFormField radioMixed = ApplicationFormField.builder()
                .id("field-3")
                .label("Option 3")
                .name("option3")
                .fieldType("RaDiO") // mixed case
                .required(true)
                .options(null)
                .sortOrder(3)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(selectLowercase, dropdownUppercase, radioMixed);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.DRAFT)
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getFields().size()); // Only selectLowercase has valid options
        assertEquals("Option 1", response.getFields().get(0).getLabel());
    }

    // ==================== VIEW PUBLISHED FORM (MEMBER AND USER) TESTS ====================

    @Test
    @DisplayName("Should successfully view published competition registration form")
    void testGetById_PublishedCompetitionForm_ShouldReturnFormDetail() {
        // Arrange
        String formId = "form-published-123";
        
        ApplicationFormField field1 = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField field2 = ApplicationFormField.builder()
                .id("field-2")
                .label("Student Code")
                .name("studentCode")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(2)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(field1, field2);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Competition Registration")
                .description("Published form for competition registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH) // Published status
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals("Published Competition Registration", response.getName());
        assertEquals(ApplicationFormType.COMPETITION_REGISTRATION, response.getFormType());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(2, response.getFields().size());
        assertEquals("comp-123", response.getCompetitionId());
        assertNotNull(response.getEndDate());
        assertTrue(response.getEndDate().isAfter(LocalDateTime.now())); // Not expired
        
        verify(formConfigRepository, times(1)).findWithFieldsById(formId);
    }

    @Test
    @DisplayName("Should successfully view published club registration form")
    void testGetById_PublishedClubForm_ShouldReturnFormDetail() {
        // Arrange
        String formId = "form-published-club-456";

        ApplicationFormField field = ApplicationFormField.builder()
                .id("field-1")
                .label("Member Name")
                .name("memberName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(field);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Club Registration")
                .description("Published form for club membership")
                .formType(ApplicationFormType.CLUB_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH) // Published status
                .endDate(LocalDateTime.now().plusDays(15))
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals("Published Club Registration", response.getName());
        assertEquals(ApplicationFormType.CLUB_REGISTRATION, response.getFormType());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(1, response.getFields().size());
    }

    @Test
    @DisplayName("Should view published form with all field types")
    void testGetById_PublishedFormWithAllFieldTypes_ShouldReturnAllFields() {
        // Arrange
        String formId = "form-all-fields";

        ApplicationFormField textField = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField emailField = ApplicationFormField.builder()
                .id("field-2")
                .label("Email")
                .name("email")
                .fieldType("EMAIL")
                .required(true)
                .sortOrder(2)
                .build();

        ApplicationFormField selectField = ApplicationFormField.builder()
                .id("field-3")
                .label("Gender")
                .name("gender")
                .fieldType("SELECT")
                .required(true)
                .options("[\"Male\", \"Female\", \"Other\"]")
                .sortOrder(3)
                .build();

        ApplicationFormField numberField = ApplicationFormField.builder()
                .id("field-4")
                .label("Age")
                .name("age")
                .fieldType("NUMBER")
                .required(false)
                .sortOrder(4)
                .build();

        ApplicationFormField dateField = ApplicationFormField.builder()
                .id("field-5")
                .label("Birth Date")
                .name("birthDate")
                .fieldType("DATE")
                .required(true)
                .sortOrder(5)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(textField, emailField, selectField, numberField, dateField);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form with All Fields")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(20))
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(5, response.getFields().size());
        assertEquals("Full Name", response.getFields().get(0).getLabel());
        assertEquals("Email", response.getFields().get(1).getLabel());
        assertEquals("Gender", response.getFields().get(2).getLabel());
        assertEquals("Age", response.getFields().get(3).getLabel());
        assertEquals("Birth Date", response.getFields().get(4).getLabel());
    }

    @Test
    @DisplayName("Should view published form even if expired (no expiration check in service)")
    void testGetById_PublishedFormExpired_ShouldStillReturnForm() {
        // Arrange
        String formId = "form-expired-123";
        LocalDateTime expiredEndDate = LocalDateTime.now().minusDays(5); // Expired

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Expired Published Form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH) // Still published
                .endDate(expiredEndDate) // But expired
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(expiredEndDate, response.getEndDate());
        assertTrue(response.getEndDate().isBefore(LocalDateTime.now())); // Confirmed expired
    }

    @Test
    @DisplayName("Should view published form without end date")
    void testGetById_PublishedFormNoEndDate_ShouldReturnForm() {
        // Arrange
        String formId = "form-no-end-date";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form No End Date")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(null) // No end date
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertNull(response.getEndDate());
    }

    @Test
    @DisplayName("Should view published form without competition")
    void testGetById_PublishedFormNoCompetition_ShouldReturnForm() {
        // Arrange
        String formId = "form-no-comp";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form No Competition")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(null) // No competition
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(10))
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertNull(response.getCompetitionId());
    }

    @Test
    @DisplayName("Should view published form accessible by all users (no role restriction)")
    void testGetById_PublishedForm_NoRoleRestriction() {
        // Arrange
        String formId = "form-public";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Public Published Form")
                .description("This form is accessible to all users")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act - No authentication/authorization context needed
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert - Service doesn't check roles, accessible to all
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        // This test confirms that the service layer doesn't enforce role-based access
        // Access control would be handled at the controller/security layer if needed
    }

    @Test
    @DisplayName("Should view published form with complex field configurations")
    void testGetById_PublishedFormComplexFields_ShouldReturnAllValidFields() {
        // Arrange
        String formId = "form-complex-fields";

        ApplicationFormField validText = ApplicationFormField.builder()
                .id("field-1")
                .label("Full Name")
                .name("fullName")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField validSelect = ApplicationFormField.builder()
                .id("field-2")
                .label("Country")
                .name("country")
                .fieldType("SELECT")
                .required(true)
                .options("[\"USA\", \"Canada\", \"Mexico\"]")
                .sortOrder(2)
                .build();

        ApplicationFormField validRadio = ApplicationFormField.builder()
                .id("field-3")
                .label("Experience Level")
                .name("experience")
                .fieldType("RADIO")
                .required(true)
                .options("[\"Beginner\", \"Intermediate\", \"Advanced\"]")
                .sortOrder(3)
                .build();

        ApplicationFormField validCheckbox = ApplicationFormField.builder()
                .id("field-4")
                .label("Interests")
                .name("interests")
                .fieldType("CHECKBOX")
                .required(false)
                .options("[\"Fighting\", \"Quyen\", \"Music\"]")
                .sortOrder(4)
                .build();

        ApplicationFormField invalidEmptyLabel = ApplicationFormField.builder()
                .id("field-5")
                .label("") // Invalid - should be filtered
                .name("invalid")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(5)
                .build();

        ApplicationFormField invalidSelectNoOptions = ApplicationFormField.builder()
                .id("field-6")
                .label("Category")
                .name("category")
                .fieldType("SELECT")
                .required(true)
                .options("") // Invalid - should be filtered
                .sortOrder(6)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(
                validText, validSelect, validRadio, validCheckbox,
                invalidEmptyLabel, invalidSelectNoOptions
        );

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Complex Published Form")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(25))
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(4, response.getFields().size()); // Only valid fields
        assertEquals("Full Name", response.getFields().get(0).getLabel());
        assertEquals("Country", response.getFields().get(1).getLabel());
        assertEquals("Experience Level", response.getFields().get(2).getLabel());
        assertEquals("Interests", response.getFields().get(3).getLabel());
    }

    @Test
    @DisplayName("Should view published form when using fallback findById")
    void testGetById_PublishedForm_FallbackToFindById() {
        // Arrange
        String formId = "form-fallback";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form Fallback")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(20))
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.empty());
        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        verify(formConfigRepository, times(1)).findWithFieldsById(formId);
        verify(formConfigRepository, times(1)).findById(formId);
    }

    @Test
    @DisplayName("Should view published form with description")
    void testGetById_PublishedFormWithDescription_ShouldIncludeDescription() {
        // Arrange
        String formId = "form-with-desc";
        String description = "This is a published tournament registration form for members and users to submit their applications.";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form with Description")
                .description(description)
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(description, response.getDescription());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
    }

    @Test
    @DisplayName("Should view published form with upcoming end date")
    void testGetById_PublishedFormUpcomingEndDate_ShouldReturnForm() {
        // Arrange
        String formId = "form-upcoming-end";
        LocalDateTime upcomingEndDate = LocalDateTime.now().plusDays(1); // Ends tomorrow

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form Ending Soon")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(upcomingEndDate)
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(upcomingEndDate, response.getEndDate());
        assertTrue(response.getEndDate().isAfter(LocalDateTime.now()));
        assertTrue(response.getEndDate().isBefore(LocalDateTime.now().plusDays(2)));
    }

    @Test
    @DisplayName("Should view published form with long end date")
    void testGetById_PublishedFormLongEndDate_ShouldReturnForm() {
        // Arrange
        String formId = "form-long-end";
        LocalDateTime longEndDate = LocalDateTime.now().plusDays(365); // One year

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form Long Duration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(longEndDate)
                .fields(new ArrayList<>())
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(formId, response.getId());
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(longEndDate, response.getEndDate());
        assertTrue(response.getEndDate().isAfter(LocalDateTime.now().plusDays(300)));
    }

    @Test
    @DisplayName("Should view published form with multiple select options")
    void testGetById_PublishedFormMultipleSelects_ShouldReturnAllSelects() {
        // Arrange
        String formId = "form-multi-select";

        ApplicationFormField select1 = ApplicationFormField.builder()
                .id("field-1")
                .label("Gender")
                .name("gender")
                .fieldType("SELECT")
                .required(true)
                .options("[\"Male\", \"Female\"]")
                .sortOrder(1)
                .build();

        ApplicationFormField select2 = ApplicationFormField.builder()
                .id("field-2")
                .label("Weight Class")
                .name("weightClass")
                .fieldType("SELECT")
                .required(true)
                .options("[\"Lightweight\", \"Middleweight\", \"Heavyweight\"]")
                .sortOrder(2)
                .build();

        ApplicationFormField select3 = ApplicationFormField.builder()
                .id("field-3")
                .label("Category")
                .name("category")
                .fieldType("DROPDOWN")
                .required(true)
                .options("[\"Fighting\", \"Quyen\", \"Music\"]")
                .sortOrder(3)
                .build();

        List<ApplicationFormField> fields = Arrays.asList(select1, select2, select3);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form Multiple Selects")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(3, response.getFields().size());
        assertEquals("Gender", response.getFields().get(0).getLabel());
        assertEquals("Weight Class", response.getFields().get(1).getLabel());
        assertEquals("Category", response.getFields().get(2).getLabel());
        assertNotNull(response.getFields().get(0).getOptions());
        assertNotNull(response.getFields().get(1).getOptions());
        assertNotNull(response.getFields().get(2).getOptions());
    }

    @Test
    @DisplayName("Should view published form with sorted fields by sortOrder")
    void testGetById_PublishedFormSortedFields_ShouldMaintainSortOrder() {
        // Arrange
        String formId = "form-sorted";

        ApplicationFormField field3 = ApplicationFormField.builder()
                .id("field-3")
                .label("Field 3")
                .name("field3")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(3)
                .build();

        ApplicationFormField field1 = ApplicationFormField.builder()
                .id("field-1")
                .label("Field 1")
                .name("field1")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(1)
                .build();

        ApplicationFormField field2 = ApplicationFormField.builder()
                .id("field-2")
                .label("Field 2")
                .name("field2")
                .fieldType("TEXT")
                .required(true)
                .sortOrder(2)
                .build();

        // Add fields in different order
        List<ApplicationFormField> fields = Arrays.asList(field3, field1, field2);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Published Form Sorted")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(fields)
                .build();

        when(formConfigRepository.findWithFieldsById(formId))
                .thenReturn(Optional.of(form));

        // Act
        FormDetailResponse response = tournamentFormService.getById(formId);

        // Assert
        assertNotNull(response);
        assertEquals(FormStatus.PUBLISH, response.getStatus());
        assertEquals(3, response.getFields().size());
        // Fields should be in the order they were in the list (not sorted by sortOrder in response)
        // The sortOrder is just a property, ordering is handled by frontend
        assertEquals("Field 3", response.getFields().get(0).getLabel());
        assertEquals("Field 1", response.getFields().get(1).getLabel());
        assertEquals("Field 2", response.getFields().get(2).getLabel());
    }

    // ==================== SUBMIT FORM (MEMBER AND USER) TESTS ====================

    @Test
    @DisplayName("Should successfully submit tournament registration form by user")
    void testSubmit_ByUser_ShouldCreateSubmission() {
        // Arrange
        String formId = "form-published-123";
        String email = "user@example.com";
        String studentId = "STU123456";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(new ArrayList<>())
                .build();

        User existingUser = new User();
        existingUser.setId("user-123");
        existingUser.setPersonalMail(email);

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"" + email + "\",\"studentId\":\"" + studentId + 
                "\",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail(email);
        request.setStudentId(studentId);
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.of(existingUser));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        assertDoesNotThrow(() -> tournamentFormService.submit(formId, request));

        // Assert
        verify(formConfigRepository, times(1)).findById(formId);
        verify(submittedRepository, atLeastOnce()).findByFormId(eq(formId), any(Pageable.class));
        verify(userRepository, times(1)).findByPersonalMail(email);
        verify(submittedRepository, atLeastOnce()).save(any(SubmittedApplicationForm.class));
    }

    @Test
    @DisplayName("Should successfully submit tournament registration form by member (no user)")
    void testSubmit_ByMember_ShouldCreateSubmission() {
        // Arrange
        String formId = "form-published-456";
        String email = "member@example.com";
        String studentId = "STU789012";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .name("Tournament Registration")
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .fields(new ArrayList<>())
                .build();

        String formDataJson = "{\"fullName\":\"Jane Doe\",\"email\":\"" + email + "\",\"studentId\":\"" + studentId + 
                "\",\"gender\":\"FEMALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("Jane Doe");
        request.setEmail(email);
        request.setStudentId(studentId);
        request.setGender("FEMALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.empty()); // No user exists
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        assertDoesNotThrow(() -> tournamentFormService.submit(formId, request));

        // Assert
        verify(formConfigRepository, times(1)).findById(formId);
        verify(userRepository, times(1)).findByPersonalMail(email);
        verify(submittedRepository, atLeastOnce()).save(argThat(submission -> {
            SubmittedApplicationForm s = (SubmittedApplicationForm) submission;
            return s.getUser() == null && s.getEmail().equals(email) && 
                   s.getStatus() == ApplicationFormStatus.PENDING;
        }));
    }

    @Test
    @DisplayName("Should throw exception when form not found")
    void testSubmit_WhenFormNotFound_ShouldThrowException() {
        // Arrange
        String formId = "non-existent-form";
        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail("test@example.com");
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setFormDataJson("{\"competitionType\":\"fighting\"}");

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(NoSuchElementException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        verify(formConfigRepository, times(1)).findById(formId);
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when required fields are missing")
    void testSubmit_WhenRequiredFieldsMissing_ShouldThrowException() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName(""); // Empty
        request.setEmail(null); // Null
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setFormDataJson("{\"competitionType\":\"fighting\"}");

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals("Missing required fields for submission", exception.getMessage());
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when duplicate email exists")
    void testSubmit_WhenDuplicateEmail_ShouldThrowException() {
        // Arrange
        String formId = "form-123";
        String email = "duplicate@example.com";
        String studentId = "STU123456";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        // Existing submission with same email
        SubmittedApplicationForm existingSubmission = SubmittedApplicationForm.builder()
                .id(1L)
                .email(email)
                .formData("{\"email\":\"" + email + "\",\"studentId\":\"STU999\"}")
                .status(ApplicationFormStatus.PENDING)
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"" + email + "\",\"studentId\":\"" + studentId + 
                "\",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail(email);
        request.setStudentId(studentId);
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(existingSubmission)));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Email này đã được đăng ký"));
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when duplicate studentId exists")
    void testSubmit_WhenDuplicateStudentId_ShouldThrowException() {
        // Arrange
        String formId = "form-123";
        String email = "new@example.com";
        String studentId = "STU123456";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        // Existing submission with same studentId
        SubmittedApplicationForm existingSubmission = SubmittedApplicationForm.builder()
                .id(1L)
                .email("other@example.com")
                .formData("{\"email\":\"other@example.com\",\"studentId\":\"" + studentId + "\"}")
                .status(ApplicationFormStatus.PENDING)
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"" + email + "\",\"studentId\":\"" + studentId + 
                "\",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail(email);
        request.setStudentId(studentId);
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(existingSubmission)));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertTrue(exception.getReason().contains("MSSV này đã được đăng ký"));
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when competitionType is missing in formData")
    void testSubmit_WhenCompetitionTypeMissing_ShouldThrowException() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"test@example.com\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"Test Club\"}"; // No competitionType

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail("test@example.com");
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Nội dung thi đấu (competitionType) là bắt buộc"));
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when form is expired")
    void testSubmit_WhenFormExpired_ShouldThrowException() {
        // Arrange
        String formId = "form-expired";
        LocalDateTime expiredEndDate = LocalDateTime.now().minusDays(5);

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(expiredEndDate) // Expired
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"test@example.com\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail("test@example.com");
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals(HttpStatus.GONE, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Form đã hết hạn"));
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should submit form even if endDate is null")
    void testSubmit_WhenEndDateNull_ShouldAllowSubmission() {
        // Arrange
        String formId = "form-no-end-date";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(null) // No end date
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"test@example.com\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail("test@example.com");
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));
        when(userRepository.findByPersonalMail(anyString()))
                .thenReturn(Optional.empty());
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        assertDoesNotThrow(() -> tournamentFormService.submit(formId, request));

        // Assert
        verify(submittedRepository, atLeastOnce()).save(any(SubmittedApplicationForm.class));
    }

    @Test
    @DisplayName("Should create submission with correct status and email")
    void testSubmit_ShouldCreateSubmissionWithCorrectStatus() {
        // Arrange
        String formId = "form-123";
        String email = "test@example.com";

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .formType(ApplicationFormType.COMPETITION_REGISTRATION)
                .competition(testCompetition)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"" + email + "\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail(email);
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.empty());
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.submit(formId, request);

        // Assert
        verify(submittedRepository, atLeastOnce()).save(argThat(submission -> {
            SubmittedApplicationForm s = (SubmittedApplicationForm) submission;
            return s.getStatus() == ApplicationFormStatus.PENDING &&
                   s.getEmail().equals(email) &&
                   s.getApplicationFormConfig().getId().equals(formId);
        }));
    }

    @Test
    @DisplayName("Should normalize email to lowercase when checking duplicates")
    void testSubmit_ShouldNormalizeEmailForDuplicateCheck() {
        // Arrange
        String formId = "form-123";
        String email = "TEST@Example.COM"; // Mixed case
        String normalizedEmail = email.toLowerCase().trim();

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        // Existing submission with lowercase email
        SubmittedApplicationForm existingSubmission = SubmittedApplicationForm.builder()
                .id(1L)
                .email(normalizedEmail)
                .formData("{\"email\":\"" + normalizedEmail + "\",\"studentId\":\"STU999\"}")
                .status(ApplicationFormStatus.PENDING)
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"" + email + "\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail(email);
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(existingSubmission)));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should normalize studentId when checking duplicates")
    void testSubmit_ShouldNormalizeStudentIdForDuplicateCheck() {
        // Arrange
        String formId = "form-123";
        String studentId = "  STU123456  "; // With spaces
        String normalizedStudentId = studentId.trim();

        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        // Existing submission with trimmed studentId
        SubmittedApplicationForm existingSubmission = SubmittedApplicationForm.builder()
                .id(1L)
                .email("other@example.com")
                .formData("{\"email\":\"other@example.com\",\"studentId\":\"" + normalizedStudentId + "\"}")
                .status(ApplicationFormStatus.PENDING)
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"test@example.com\",\"studentId\":\"" + studentId + 
                "\",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail("test@example.com");
        request.setStudentId(studentId);
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(existingSubmission)));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertTrue(exception.getReason().contains("MSSV"));
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when formDataJson is invalid JSON")
    void testSubmit_WhenInvalidJson_ShouldThrowException() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail("test@example.com");
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setClub("Test Club");
        request.setFormDataJson("invalid json {["); // Invalid JSON

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));

        // Act & Assert
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            tournamentFormService.submit(formId, request);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertTrue(exception.getReason().contains("Dữ liệu form không hợp lệ"));
        verify(submittedRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should submit for different competition types")
    void testSubmit_WithDifferentCompetitionTypes_ShouldCreateSubmission() {
        String[] competitionTypes = {"fighting", "quyen", "music"};

        for (String compType : competitionTypes) {
            // Arrange
            String formId = "form-" + compType;
            ApplicationFormConfig form = ApplicationFormConfig.builder()
                    .id(formId)
                    .competition(testCompetition)
                    .status(FormStatus.PUBLISH)
                    .endDate(LocalDateTime.now().plusDays(30))
                    .build();

            String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"test" + compType + "@example.com\"" +
                    ",\"studentId\":\"STU123" + compType + "\",\"gender\":\"MALE\",\"club\":\"Test Club\"" +
                    ",\"competitionType\":\"" + compType + "\"}";

            CreateSubmissionRequest request = new CreateSubmissionRequest();
            request.setFullName("John Doe");
            request.setEmail("test" + compType + "@example.com");
            request.setStudentId("STU123" + compType);
            request.setGender("MALE");
            request.setClub("Test Club");
            request.setFormDataJson(formDataJson);

            when(formConfigRepository.findById(formId))
                    .thenReturn(Optional.of(form));
            when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(new ArrayList<>()));
            when(userRepository.findByPersonalMail(anyString()))
                    .thenReturn(Optional.empty());
            when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            assertDoesNotThrow(() -> tournamentFormService.submit(formId, request));

            // Assert
            verify(submittedRepository, atLeastOnce()).save(any(SubmittedApplicationForm.class));

            // Reset mocks for next iteration
            reset(formConfigRepository);
            reset(submittedRepository);
            reset(userRepository);
        }
    }

    @Test
    @DisplayName("Should handle submission when club field is empty")
    void testSubmit_WhenClubEmpty_ShouldStillCreateSubmission() {
        // Arrange
        String formId = "form-123";
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .id(formId)
                .status(FormStatus.PUBLISH)
                .endDate(LocalDateTime.now().plusDays(30))
                .build();

        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"test@example.com\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"\",\"competitionType\":\"fighting\"}";

        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setFullName("John Doe");
        request.setEmail("test@example.com");
        request.setStudentId("STU123");
        request.setGender("MALE");
        request.setClub(""); // Empty club
        request.setFormDataJson(formDataJson);

        when(formConfigRepository.findById(formId))
                .thenReturn(Optional.of(form));
        when(submittedRepository.findByFormId(eq(formId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(new ArrayList<>()));
        when(userRepository.findByPersonalMail(anyString()))
                .thenReturn(Optional.empty());
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        assertDoesNotThrow(() -> tournamentFormService.submit(formId, request));

        // Assert
        verify(submittedRepository, atLeastOnce()).save(any(SubmittedApplicationForm.class));
    }

    // ==================== APPROVE CONTESTANTS TESTS ====================

    @Test
    @DisplayName("Should approve submission and create athlete for fighting competition")
    void testUpdateSubmissionStatus_ApproveFighting_ShouldCreateAthlete() {
        // Arrange
        Long submissionId = 1L;
        String email = "athlete@example.com";
        String studentId = "STU123456";
        String formDataJson = "{\"fullName\":\"John Doe\",\"email\":\"" + email + "\",\"studentId\":\"" + studentId + 
                "\",\"gender\":\"MALE\",\"club\":\"Test Club\",\"competitionType\":\"fighting\",\"weightClassId\":\"wc-123\"}";

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email(email)
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(testCompetition)
                        .build())
                .build();

        User user = new User();
        user.setId("user-123");
        user.setPersonalMail(email);

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(athleteService).deleteByEmailAndTournamentId(email, "comp-123");
        when(athleteService.create(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.of(user));
        when(competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole("comp-123", "user-123", CompetitionRoleType.ATHLETE))
                .thenReturn(false);
        when(competitionRoleRepository.save(any(CompetitionRole.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(submittedRepository, times(1)).findById(submissionId);
        verify(submittedRepository, atLeastOnce()).save(argThat(s -> 
                s.getStatus() == ApplicationFormStatus.APPROVED));
        verify(athleteService, times(1)).deleteByEmailAndTournamentId(email, "comp-123");
        verify(athleteService, times(1)).create(argThat(athlete ->
                athlete.getEmail().equals(email) &&
                athlete.getTournamentId().equals("comp-123") &&
                athlete.getCompetitionType() == Athlete.CompetitionType.fighting &&
                athlete.getStatus() == Athlete.AthleteStatus.NOT_STARTED &&
                athlete.getWeightClassId() != null
        ));
        verify(competitionRoleRepository, times(1)).save(argThat(role ->
                role.getRole() == CompetitionRoleType.ATHLETE &&
                role.getCompetition().getId().equals("comp-123") &&
                role.getUser().getId().equals("user-123")
        ));
    }

    @Test
    @DisplayName("Should approve submission and create athlete for member (no user)")
    void testUpdateSubmissionStatus_ApproveMember_ShouldCreateAthleteAndRole() {
        // Arrange
        Long submissionId = 2L;
        String email = "member@example.com";
        String studentId = "STU789012";
        String formDataJson = "{\"fullName\":\"Jane Doe\",\"email\":\"" + email + "\",\"studentId\":\"" + studentId + 
                "\",\"gender\":\"FEMALE\",\"club\":\"Member Club\",\"competitionType\":\"quyen\",\"fistConfigId\":\"fist-123\"}";

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email(email)
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(testCompetition)
                        .build())
                .build();

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(athleteService).deleteByEmailAndTournamentId(email, "comp-123");
        when(athleteService.create(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.empty()); // No user exists
        when(competitionRoleRepository.existsByCompetitionIdAndEmailAndRole("comp-123", email, CompetitionRoleType.ATHLETE))
                .thenReturn(false);
        when(competitionRoleRepository.save(any(CompetitionRole.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(submittedRepository, atLeastOnce()).save(argThat(s -> 
                s.getStatus() == ApplicationFormStatus.APPROVED));
        verify(athleteService, times(1)).create(argThat(athlete ->
                athlete.getEmail().equals(email) &&
                athlete.getCompetitionType() == Athlete.CompetitionType.quyen
        ));
        verify(competitionRoleRepository, times(1)).save(argThat(role ->
                role.getRole() == CompetitionRoleType.ATHLETE &&
                role.getUser() == null &&
                role.getEmail().equals(email)
        ));
    }

    @Test
    @DisplayName("Should approve submission for music competition")
    void testUpdateSubmissionStatus_ApproveMusic_ShouldCreateAthlete() {
        // Arrange
        Long submissionId = 3L;
        String email = "music@example.com";
        String formDataJson = "{\"fullName\":\"Music Player\",\"email\":\"" + email + "\",\"studentId\":\"STU111\"" +
                ",\"gender\":\"MALE\",\"club\":\"Music Club\",\"competitionType\":\"music\",\"musicContentId\":\"music-123\"}";

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email(email)
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(testCompetition)
                        .build())
                .build();

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(athleteService).deleteByEmailAndTournamentId(email, "comp-123");
        when(athleteService.create(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.empty());
        when(competitionRoleRepository.existsByCompetitionIdAndEmailAndRole(eq("comp-123"), eq(email), eq(CompetitionRoleType.ATHLETE)))
                .thenReturn(false);
        when(competitionRoleRepository.save(any(CompetitionRole.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(athleteService, times(1)).create(argThat(athlete ->
                athlete.getCompetitionType() == Athlete.CompetitionType.music &&
                athlete.getMusicContentId() != null &&
                athlete.getSubCompetitionType() != null &&
                athlete.getSubCompetitionType().equals("Tiết mục")
        ));
    }

    @Test
    @DisplayName("Should not create athlete when status is not APPROVED")
    void testUpdateSubmissionStatus_Reject_ShouldNotCreateAthlete() {
        // Arrange
        Long submissionId = 4L;
        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email("test@example.com")
                .formData("{\"competitionType\":\"fighting\"}")
                .status(ApplicationFormStatus.PENDING)
                .build();

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.REJECTED);

        // Assert
        verify(submittedRepository, times(1)).save(argThat(s -> 
                s.getStatus() == ApplicationFormStatus.REJECTED));
        verify(athleteService, never()).create(any(Athlete.class));
        verify(athleteService, never()).deleteByEmailAndTournamentId(anyString(), anyString());
    }

    @Test
    @DisplayName("Should delete existing athlete before creating new one")
    void testUpdateSubmissionStatus_Approve_ShouldDeleteExistingAthlete() {
        // Arrange
        Long submissionId = 5L;
        String email = "existing@example.com";
        String formDataJson = "{\"fullName\":\"Existing Athlete\",\"email\":\"" + email + "\",\"studentId\":\"STU999\"" +
                ",\"gender\":\"MALE\",\"club\":\"Club\",\"competitionType\":\"fighting\"}";

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email(email)
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(testCompetition)
                        .build())
                .build();

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(athleteService).deleteByEmailAndTournamentId(email, "comp-123");
        when(athleteService.create(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.empty());
        when(competitionRoleRepository.existsByCompetitionIdAndEmailAndRole(eq("comp-123"), eq(email), eq(CompetitionRoleType.ATHLETE)))
                .thenReturn(false);
        when(competitionRoleRepository.save(any(CompetitionRole.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(athleteService, times(1)).deleteByEmailAndTournamentId(email, "comp-123");
        verify(athleteService, times(1)).create(any(Athlete.class));
    }

    @Test
    @DisplayName("Should not create CompetitionRole if it already exists")
    void testUpdateSubmissionStatus_Approve_ShouldNotDuplicateCompetitionRole() {
        // Arrange
        Long submissionId = 6L;
        String email = "existingrole@example.com";
        String formDataJson = "{\"fullName\":\"Test User\",\"email\":\"" + email + "\",\"studentId\":\"STU888\"" +
                ",\"gender\":\"MALE\",\"club\":\"Club\",\"competitionType\":\"fighting\"}";

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email(email)
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(testCompetition)
                        .build())
                .build();

        User user = new User();
        user.setId("user-456");
        user.setPersonalMail(email);

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(athleteService).deleteByEmailAndTournamentId(email, "comp-123");
        when(athleteService.create(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.of(user));
        when(competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole("comp-123", "user-456", CompetitionRoleType.ATHLETE))
                .thenReturn(true); // Role already exists

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(competitionRoleRepository, never()).save(any(CompetitionRole.class));
        verify(athleteService, times(1)).create(any(Athlete.class)); // Athlete still created
    }

    @Test
    @DisplayName("Should not create athlete when required fields are missing")
    void testUpdateSubmissionStatus_ApproveMissingFields_ShouldNotCreateAthlete() {
        // Arrange
        Long submissionId = 7L;
        String formDataJson = "{\"fullName\":\"Test\"}"; // Missing email, competitionType, etc.

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email("test@example.com")
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(testCompetition)
                        .build())
                .build();

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(submittedRepository, atLeastOnce()).save(argThat(s -> 
                s.getStatus() == ApplicationFormStatus.APPROVED));
        verify(athleteService, never()).create(any(Athlete.class));
    }

    @Test
    @DisplayName("Should handle approval when form has no competition")
    void testUpdateSubmissionStatus_ApproveNoCompetition_ShouldNotCreateAthlete() {
        // Arrange
        Long submissionId = 8L;
        String formDataJson = "{\"fullName\":\"Test\",\"email\":\"test@example.com\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"Club\",\"competitionType\":\"fighting\"}";

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email("test@example.com")
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(null) // No competition
                        .build())
                .build();

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(submittedRepository, atLeastOnce()).save(argThat(s -> 
                s.getStatus() == ApplicationFormStatus.APPROVED));
        verify(athleteService, never()).create(any(Athlete.class));
    }

    @Test
    @DisplayName("Should set correct athlete status to NOT_STARTED when approved")
    void testUpdateSubmissionStatus_Approve_ShouldSetAthleteStatusNotStarted() {
        // Arrange
        Long submissionId = 9L;
        String email = "athlete@example.com";
        String formDataJson = "{\"fullName\":\"Athlete\",\"email\":\"" + email + "\",\"studentId\":\"STU123\"" +
                ",\"gender\":\"MALE\",\"club\":\"Club\",\"competitionType\":\"fighting\"}";

        SubmittedApplicationForm submission = SubmittedApplicationForm.builder()
                .id(submissionId)
                .email(email)
                .formData(formDataJson)
                .status(ApplicationFormStatus.PENDING)
                .applicationFormConfig(ApplicationFormConfig.builder()
                        .id("form-123")
                        .competition(testCompetition)
                        .build())
                .build();

        when(submittedRepository.findById(submissionId))
                .thenReturn(Optional.of(submission));
        when(submittedRepository.save(any(SubmittedApplicationForm.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(athleteService).deleteByEmailAndTournamentId(email, "comp-123");
        when(athleteService.create(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(competitionRepository.findById("comp-123"))
                .thenReturn(Optional.of(testCompetition));
        when(userRepository.findByPersonalMail(email))
                .thenReturn(Optional.empty());
        when(competitionRoleRepository.existsByCompetitionIdAndEmailAndRole(eq("comp-123"), eq(email), eq(CompetitionRoleType.ATHLETE)))
                .thenReturn(false);
        when(competitionRoleRepository.save(any(CompetitionRole.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        tournamentFormService.updateSubmissionStatus(submissionId, ApplicationFormStatus.APPROVED);

        // Assert
        verify(athleteService, times(1)).create(argThat(athlete ->
                athlete.getStatus() == Athlete.AthleteStatus.NOT_STARTED
        ));
    }
}


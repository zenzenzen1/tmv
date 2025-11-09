package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.PlatformTransactionManager;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.response.*;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.enums.FormStatus;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.repository.SubmittedApplicationFormRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.repository.CompetitionRoleRepository;
import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.service.TournamentFormService;
import sep490g65.fvcapi.utils.ResponseUtils;
import sep490g65.fvcapi.dto.request.CreateFormRequest;
import sep490g65.fvcapi.dto.request.UpdateFormRequest;
import sep490g65.fvcapi.dto.request.CreateSubmissionRequest;
import sep490g65.fvcapi.service.AthleteService;
import sep490g65.fvcapi.service.PerformanceService;
import sep490g65.fvcapi.dto.request.CreatePerformanceRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.entity.CompetitionRole;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.CompetitionRoleType;
import sep490g65.fvcapi.repository.WeightClassRepository;
import sep490g65.fvcapi.repository.VovinamFistConfigRepository;
import sep490g65.fvcapi.repository.VovinamFistItemRepository;
import sep490g65.fvcapi.repository.MusicIntegratedPerformanceRepository;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TournamentFormServiceImpl implements TournamentFormService {

    private final CompetitionRepository competitionRepository;
    private final ApplicationFormConfigRepository formConfigRepository;
    private final SubmittedApplicationFormRepository submittedRepository;
    private final UserRepository userRepository;
    private final AthleteService athleteService;
    private final CompetitionRoleRepository competitionRoleRepository;
    private final PerformanceService performanceService;
    private final WeightClassRepository weightClassRepository;
    private final VovinamFistConfigRepository fistConfigRepository;
    private final VovinamFistItemRepository fistItemRepository;
    private final MusicIntegratedPerformanceRepository musicRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PlatformTransactionManager transactionManager;

    private TournamentFormResponse toDto(Competition c) {
        String status = resolveStatus(c);
        return TournamentFormResponse.builder()
                .id(c.getId())
                .tournamentName(c.getName())
                .formTitle(c.getName())
                .numberOfParticipants(c.getNumberOfParticipants())
                .createdAt(c.getCreatedAt())
                .status(status)
                .build();
    }

    private String resolveStatus(Competition c) {
        if (c.getFormStatus() != null) {
            FormStatus s = c.getFormStatus();
            switch (s) {
                case DRAFT: return "draft";
                case PUBLISH: return "publish";
                case ARCHIVED: return "archived";
                case POSTPONE: return "postpone";
            }
        }
        // fallback: compute by dates
        LocalDate today = LocalDate.now();
        LocalDate start = c.getRegistrationStartDate();
        LocalDate end = c.getRegistrationEndDate();

        if (end != null && today.isAfter(end)) {
            return "closed";
        }
        if (start != null && end != null && (today.isEqual(start) || today.isAfter(start)) && (today.isBefore(end) || today.isEqual(end))) {
            return "published";
        }
        return "draft";
    }

    @Override
    public PaginationResponse<TournamentFormResponse> list(RequestParam params) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        String keyword = params.hasSearch() ? ("%" + params.getSearchTerm().toLowerCase() + "%") : null;
        Page<ApplicationFormConfig> page = formConfigRepository.search(keyword, pageable);
        Page<TournamentFormResponse> mapped = page.map(this::toDtoFromForm);
        return ResponseUtils.createPaginatedResponse(mapped);
    }

    @Override
    @Transactional
    public TournamentFormResponse create(CreateFormRequest request) {
        Competition comp = competitionRepository.findById(request.getCompetitionId()).orElseThrow(() -> new java.util.NoSuchElementException("không tồn tại giải đấu này"));
        // Enforce one form per competition
        long existingCount = formConfigRepository.countByCompetition_Id(comp.getId());
        if (existingCount > 0) {
            throw new IllegalStateException("giải đấu này đã được tạo form");
        }

        // Validate title required and length policy
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tiêu đề form không được để trống");
        }
        if (request.getName().length() > 50) {
            throw new IllegalArgumentException("Tiêu đề form không được vượt quá 50 ký tự");
        }
        // Validate end date required and must be in the future
        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày đóng form");
        }
        if (java.time.LocalDateTime.now().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Ngày đóng form phải lớn hơn ngày hiện tại");
        }
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .name(request.getName())
                .description(request.getDescription())
                .formType(request.getFormType())
                .competition(comp)
                .status(request.getStatus() != null ? request.getStatus() : sep490g65.fvcapi.enums.FormStatus.DRAFT)
                .endDate(request.getEndDate())
                .build();

        // attach fields if provided
        if (request.getFields() != null && !request.getFields().isEmpty()) {
            java.util.List<sep490g65.fvcapi.entity.ApplicationFormField> fieldEntities = new java.util.ArrayList<>();
            for (sep490g65.fvcapi.dto.request.FormFieldUpsert up : request.getFields()) {
                // server-side validation: label is required
                if (up.getLabel() == null || up.getLabel().trim().isEmpty()) {
                    throw new IllegalArgumentException("Câu hỏi thêm không được để trống nội dung");
                }
                // Only validate options for field types that require them
                if ("SELECT".equalsIgnoreCase(up.getFieldType()) || "DROPDOWN".equalsIgnoreCase(up.getFieldType()) || 
                    "RADIO".equalsIgnoreCase(up.getFieldType()) || "CHECKBOX".equalsIgnoreCase(up.getFieldType()) ||
                    "MULTIPLE-CHOICE".equalsIgnoreCase(up.getFieldType())) {
                    boolean hasOptions = up.getOptions() != null && !up.getOptions().trim().isEmpty() && !"[]".equals(up.getOptions().trim());
                    if (!hasOptions) {
                        if ("SELECT".equalsIgnoreCase(up.getFieldType()) || "DROPDOWN".equalsIgnoreCase(up.getFieldType())) {
                            throw new IllegalArgumentException("Vui lòng thêm ít nhất 1 lựa chọn");
                        }
                        continue;
                    }
                }
                sep490g65.fvcapi.entity.ApplicationFormField fld = sep490g65.fvcapi.entity.ApplicationFormField.builder()
                        .applicationFormConfig(form)
                        .label(up.getLabel())
                        .name(up.getName())
                        .fieldType(up.getFieldType())
                        .required(up.getRequired() != null ? up.getRequired() : Boolean.TRUE)
                        .options(up.getOptions())
                        .sortOrder(up.getSortOrder() != null ? up.getSortOrder() : 0)
                        .build();
                fieldEntities.add(fld);
            }
            form.setFields(fieldEntities);
        }

        // Ensure slug exists when publishing
        if (form.getStatus() == sep490g65.fvcapi.enums.FormStatus.PUBLISH && form.getPublicSlug() == null) {
            form.setPublicSlug(generateUniqueSlug(form.getName()));
        }
        
        ApplicationFormConfig saved = formConfigRepository.save(form);
        TournamentFormResponse resp = toDtoFromForm(saved);
        resp.setMessage("Tạo form thành công");
        return resp;
    }

    @Override
    public FormDetailResponse getById(String id) {
        ApplicationFormConfig f = formConfigRepository.findWithFieldsById(id).orElseGet(() -> formConfigRepository.findById(id).orElseThrow());
        java.util.List<FormFieldDto> fields = new java.util.ArrayList<>();
        if (f.getFields() != null) {
            for (sep490g65.fvcapi.entity.ApplicationFormField fld : f.getFields()) {
                // filter out invalid/incomplete fields from response
                if (fld.getLabel() == null || fld.getLabel().trim().isEmpty()) {
                    continue;
                }
                // Only validate options for field types that require them
                if ("SELECT".equalsIgnoreCase(fld.getFieldType()) || "DROPDOWN".equalsIgnoreCase(fld.getFieldType()) || 
                    "RADIO".equalsIgnoreCase(fld.getFieldType()) || "CHECKBOX".equalsIgnoreCase(fld.getFieldType()) ||
                    "MULTIPLE-CHOICE".equalsIgnoreCase(fld.getFieldType())) {
                    String opts = fld.getOptions();
                    if (opts == null || opts.trim().isEmpty() || "[]".equals(opts.trim())) {
                        continue;
                    }
                }
                fields.add(FormFieldDto.builder()
                        .id(fld.getId())
                        .label(fld.getLabel())
                        .name(fld.getName())
                        .fieldType(fld.getFieldType())
                        .required(fld.getRequired())
                        .options(fld.getOptions())
                        .sortOrder(fld.getSortOrder())
                        .build());
            }
        }
        return FormDetailResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .description(f.getDescription())
                .formType(f.getFormType())
                .competitionId(f.getCompetition() != null ? f.getCompetition().getId() : null)
                .status(f.getStatus())
                .endDate(f.getEndDate())
                .createdAt(f.getCreatedAt())
                .fields(fields)
                .publicSlug(f.getPublicSlug())
                .publicLink(f.getId() != null ? "/published-form/" + f.getId() : null)
                .build();
    }

    @Override
    @Transactional
    public FormDetailResponse update(String id, UpdateFormRequest request) {
        ApplicationFormConfig f = formConfigRepository.findWithFieldsById(id).orElseThrow();
        if (request.getName() != null) f.setName(request.getName());
        if (request.getDescription() != null) f.setDescription(request.getDescription());
        if (request.getFormType() != null) f.setFormType(request.getFormType());
        if (request.getCompetitionId() != null) {
            Competition c = competitionRepository.findById(request.getCompetitionId()).orElseThrow();
            f.setCompetition(c);
        }
        if (request.getStatus() != null) f.setStatus(request.getStatus());
        if (request.getEndDate() != null) f.setEndDate(request.getEndDate());
        
        // Ensure slug exists when publishing
        if (f.getStatus() == sep490g65.fvcapi.enums.FormStatus.PUBLISH && f.getPublicSlug() == null) {
            f.setPublicSlug(generateUniqueSlug(f.getName()));
        }
        
        // upsert fields
        if (request.getFields() != null) {
            java.util.Map<String, sep490g65.fvcapi.entity.ApplicationFormField> existing = new java.util.HashMap<>();
            if (f.getFields() != null) {
                for (sep490g65.fvcapi.entity.ApplicationFormField ef : f.getFields()) {
                    existing.put(ef.getId(), ef);
                }
            } else {
                f.setFields(new java.util.ArrayList<>());
            }
            java.util.List<sep490g65.fvcapi.entity.ApplicationFormField> next = new java.util.ArrayList<>();
            for (sep490g65.fvcapi.dto.request.FormFieldUpsert up : request.getFields()) {
                // server-side validation: skip invalid ad-hoc fields
                if (up.getLabel() == null || up.getLabel().trim().isEmpty()) {
                    continue;
                }
                // Only validate options for field types that require them
                if ("SELECT".equalsIgnoreCase(up.getFieldType()) || "DROPDOWN".equalsIgnoreCase(up.getFieldType()) || 
                    "RADIO".equalsIgnoreCase(up.getFieldType()) || "CHECKBOX".equalsIgnoreCase(up.getFieldType()) ||
                    "MULTIPLE-CHOICE".equalsIgnoreCase(up.getFieldType())) {
                    boolean hasOptions = up.getOptions() != null && !up.getOptions().trim().isEmpty() && !"[]".equals(up.getOptions().trim());
                    if (!hasOptions) continue;
                }
                sep490g65.fvcapi.entity.ApplicationFormField tgt = (up.getId() != null && existing.containsKey(up.getId()))
                        ? existing.get(up.getId())
                        : sep490g65.fvcapi.entity.ApplicationFormField.builder().applicationFormConfig(f).build();
                tgt.setLabel(up.getLabel());
                tgt.setName(up.getName());
                tgt.setFieldType(up.getFieldType());
                tgt.setRequired(up.getRequired() != null ? up.getRequired() : Boolean.TRUE);
                tgt.setOptions(up.getOptions());
                tgt.setSortOrder(up.getSortOrder() != null ? up.getSortOrder() : 0);
                next.add(tgt);
            }
            f.getFields().clear();
            f.getFields().addAll(next);
        }
        ApplicationFormConfig saved = formConfigRepository.save(f);
        return getById(saved.getId());
    }

    @Override
    @Transactional
    public void updateStatus(String id, FormStatus status) {
        ApplicationFormConfig form = formConfigRepository.findById(id).orElseThrow();
        form.setStatus(status);
        formConfigRepository.save(form);
    }

    @Override
    public PaginationResponse<SubmittedFormResponse> listSubmissions(String formId, RequestParam params) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = params.isAll() ? Pageable.unpaged() : PageRequest.of(params.getPage(), params.getSize(), sort);
        Page<sep490g65.fvcapi.entity.SubmittedApplicationForm> page = submittedRepository.findByFormId(formId, pageable);
        Page<sep490g65.fvcapi.dto.response.SubmittedFormResponse> mapped = page.map(s -> sep490g65.fvcapi.dto.response.SubmittedFormResponse.builder()
                .id(s.getId())
                .formData(s.getFormData())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                .build());
        return ResponseUtils.createPaginatedResponse(mapped);
    }

    @Override
    @Transactional(readOnly = false)
    public void updateSubmissionStatus(Long submissionId, ApplicationFormStatus status) {
        sep490g65.fvcapi.entity.SubmittedApplicationForm s = submittedRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("SubmittedApplicationForm", "id", submissionId));
        s.setStatus(status);
        submittedRepository.save(s);

        // On approval, upsert an athlete based on submission data
        // Run all approval side-effects in a separate transaction to ensure status update succeeds even if athlete creation fails
        if (status == ApplicationFormStatus.APPROVED) {
            TransactionTemplate approvalTpl = new TransactionTemplate(transactionManager);
            approvalTpl.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            approvalTpl.executeWithoutResult((txStatus) -> {
                try {
                    String formJson = s.getFormData();
                    JsonNode root = formJson != null ? objectMapper.readTree(formJson) : objectMapper.createObjectNode();

                    // Chạy side-effects trong transaction REQUIRES_NEW thông qua TransactionTemplate để tránh self-invocation issue
                    TransactionTemplate tpl = new TransactionTemplate(transactionManager);
                    tpl.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                    tpl.execute(innerTxStatus -> {
                        try { 
                            upsertAthleteAndRole(root, s); 
                        } catch (Exception innerEx) { 
                            log.warn("Failed to upsert athlete and role in separate transaction for submission {}: {}", 
                                    submissionId, innerEx.getMessage(), innerEx);
                        }
                        return null;
                    });
                String fullName = textOrNull(root, "fullName");
                String email = textOrNull(root, "email");
                String club = textOrNull(root, "club");
                String competitionTypeStr = textOrNull(root, "competitionType");
                String genderStr = textOrNull(root, "gender");
                String studentId = textOrNull(root, "studentId");

                Athlete.Gender gender = parseGender(genderStr);
                Athlete.CompetitionType competitionType = parseCompetitionType(competitionTypeStr);
                
                // Extract hierarchical competition structure
                String subCompetitionType = resolveSubCompetitionType(root, competitionTypeStr);

                String competitionId = null;
                if (s.getApplicationFormConfig() != null && s.getApplicationFormConfig().getCompetition() != null) {
                    String compId = s.getApplicationFormConfig().getCompetition().getId();
                    if (compId != null && !compId.isBlank()) {
                        competitionId = compId;
                    }
                }

                // Read performanceId (team) early so it's available outside inner block
                String perfIdForTeam = textOrNull(root, "performanceId");
                boolean isTeamSubmission = false;
                try {
                    Integer ppe = root.hasNonNull("participantsPerEntry") ? root.get("participantsPerEntry").asInt() : null;
                    boolean hasMembers = root.has("teamMembers") && root.get("teamMembers").isArray() && root.get("teamMembers").size() > 0;
                    isTeamSubmission = (ppe != null && ppe > 1) || hasMembers || (perfIdForTeam != null && !perfIdForTeam.isBlank());
                } catch (Exception ignoredCalc) {}

                // Create Athlete for both individual and team submissions
                if (competitionId != null && fullName != null && email != null && gender != null && competitionType != null) {
                // Extract preferred IDs for tight linking and storing into detail_sub
                String weightClassId = textOrNull(root, "weightClassId");
                String fistItemId    = textOrNull(root, "fistItemId");
                if (fistItemId == null || fistItemId.isBlank()) {
                    String qid = textOrNull(root, "quyenContentId");
                    if (qid != null && !qid.isBlank()) fistItemId = qid;
                }
                String musicContentId= textOrNull(root, "musicContentId");
                String fistConfigId  = textOrNull(root, "fistConfigId");

                // For Quyền, ensure subCompetitionType is the category name (e.g., "đa luyện")
                String subCompetitionTypeFinal = subCompetitionType;
                try {
                    if (competitionType == Athlete.CompetitionType.quyen) {
                        // Prefer direct value from form buttons (quyenCategory)
                        String quyenCategoryFromForm = textOrNull(root, "quyenCategory");
                        if (quyenCategoryFromForm != null && !quyenCategoryFromForm.isBlank()) {
                            subCompetitionTypeFinal = quyenCategoryFromForm;
                        }
                        // Fallback: resolve from config name when form value missing or generic
                        if (subCompetitionTypeFinal == null || subCompetitionTypeFinal.isBlank() || "Quyền".equalsIgnoreCase(subCompetitionTypeFinal)) {
                            if (fistConfigId != null && !fistConfigId.isBlank()) {
                                var cfg = fistConfigRepository.findById(fistConfigId).orElse(null);
                                if (cfg != null && cfg.getName() != null && !cfg.getName().isBlank()) {
                                    subCompetitionTypeFinal = cfg.getName();
                                }
                            }
                        }
                    }
                } catch (Exception ignoredResolveCfg) { }

                    // Use upsert to avoid duplicate key constraint violations
                    Athlete.AthleteBuilder builder = Athlete.builder()
                        .competitionId(competitionId)
                        .fullName(fullName)
                        .email(email)
                        .studentId(studentId)
                        .gender(gender)
                        .club(club)
                        .competitionType(competitionType)
                        .subCompetitionType(subCompetitionTypeFinal)
                        .status(Athlete.AthleteStatus.NOT_STARTED);

                    // Prefer IDs from submission formData for FK columns
                    if (weightClassId != null && !weightClassId.isBlank()) builder.weightClassId(weightClassId);
                    if (fistConfigId  != null && !fistConfigId.isBlank())  builder.fistConfigId(fistConfigId);
                    // Persist both config and item to support list/filters
                    if (musicContentId!= null && !musicContentId.isBlank()) builder.musicContentId(musicContentId);
                    if (fistItemId != null && !fistItemId.isBlank()) builder.fistItemId(fistItemId);

                    // Use upsert instead of delete + create to avoid race conditions and constraint violations
                    Athlete athlete = athleteService.upsert(builder.build());
                    
                    // Create CompetitionRole for the athlete (always create)
                    Competition competition = competitionRepository.findById(competitionId).orElse(null);
                    User user = userRepository.findByPersonalMail(email).orElse(null);
                    
                    if (competition != null) {
                        // Check if CompetitionRole already exists
                        boolean roleExists = false;
                        if (user != null) {
                            roleExists = competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole(
                                competitionId, user.getId(), CompetitionRoleType.ATHLETE);
                        } else {
                            // For non-system users, check by email
                            roleExists = competitionRoleRepository.existsByCompetitionIdAndEmailAndRole(
                                competitionId, email, CompetitionRoleType.ATHLETE);
                        }
                        
                        if (!roleExists) {
                            CompetitionRole competitionRole = CompetitionRole.builder()
                                .competition(competition)
                                .user(user) // null if user doesn't exist
                                .email(email) // store email for non-system users
                                .role(CompetitionRoleType.ATHLETE)
                                .build();
                            
                            competitionRoleRepository.save(competitionRole);
                        }
                    }
                    // Note: Athlete record and CompetitionRole are always created
                }
                // If this submission belongs to a team (performance), approve the whole team
                if (perfIdForTeam != null && !perfIdForTeam.isBlank()) {
                    try { performanceService.approve(perfIdForTeam); } catch (Exception ignoredApprove) { }
                    // After approval, propagate content IDs from Performance to all team members' athlete rows
                    try {
                        final String competitionIdFinal = competitionId;
                        
                        // Get Performance to extract content information
                        try {
                            PerformanceResponse perfResponse = performanceService.getPerformanceById(perfIdForTeam);
                            String performanceContentId = perfResponse.getContentId();
                            Performance.ContentType perfContentType = perfResponse.getContentType();
                            
                            // Extract content IDs from form data
                            final String fistConfigIdFromForm = textOrNull(root, "fistConfigId");
                            final String quyenContentIdFromForm = textOrNull(root, "quyenContentId");
                            final String fistItemIdFromForm = textOrNull(root, "fistItemId");
                            final String musicContentIdFromForm = textOrNull(root, "musicContentId");
                            
                            // Use Performance contentId as fallback if form data is missing
                            String finalFistConfigId = fistConfigIdFromForm;
                            String finalMusicContentId = musicContentIdFromForm;
                            if (perfContentType == Performance.ContentType.QUYEN && performanceContentId != null && !performanceContentId.isBlank()) {
                                finalFistConfigId = finalFistConfigId != null ? finalFistConfigId : performanceContentId;
                            } else if (perfContentType == Performance.ContentType.MUSIC && performanceContentId != null && !performanceContentId.isBlank()) {
                                finalMusicContentId = finalMusicContentId != null ? finalMusicContentId : performanceContentId;
                            }

                            java.util.Set<String> emails = new java.util.LinkedHashSet<>();
                            if (email != null && !email.isBlank()) emails.add(email);
                            try {
                                JsonNode members = root.get("teamMembers");
                                if (members != null && members.isArray()) {
                                    for (JsonNode m : members) {
                                        if (m.hasNonNull("email")) {
                                            String em = m.get("email").asText("").trim();
                                            if (!em.isBlank()) emails.add(em);
                                        }
                                    }
                                }
                            } catch (Exception ignoredMembers) {}

                            for (String em : emails) {
                                try {
                                    // Only update existing athletes to avoid creating invalid rows without required fields
                                    java.util.Optional<sep490g65.fvcapi.entity.Athlete> existingOpt = 
                                            athleteService.list(competitionIdFinal, null, null, null, null, null, null, org.springframework.data.domain.Pageable.unpaged())
                                            .getContent()
                                            .stream().filter(a -> em.equalsIgnoreCase(a.getEmail())).findFirst();
                                    if (existingOpt.isPresent()) {
                                        Athlete existingAthlete = existingOpt.get();
                                        
                                        // Set competition type based on Performance content type
                                        Athlete.CompetitionType perfCompetitionType = Athlete.CompetitionType.fighting;
                                        if (perfContentType == Performance.ContentType.QUYEN) {
                                            perfCompetitionType = Athlete.CompetitionType.quyen;
                                        } else if (perfContentType == Performance.ContentType.MUSIC) {
                                            perfCompetitionType = Athlete.CompetitionType.music;
                                        }
                                        existingAthlete.setCompetitionType(perfCompetitionType);
                                        
                                        // Set sub competition type
                                        String perfSubCompType = null;
                                        if (perfContentType == Performance.ContentType.QUYEN) {
                                            // Prefer the Quyền category name from (final -> existing -> item->config)
                                            try {
                                                String tryCfgId = null;
                                                if (finalFistConfigId != null && !finalFistConfigId.isBlank()) tryCfgId = finalFistConfigId;
                                                if ((tryCfgId == null || tryCfgId.isBlank()) && existingAthlete.getFistConfigId() != null) {
                                                    tryCfgId = existingAthlete.getFistConfigId();
                                                }
                                                if ((tryCfgId == null || tryCfgId.isBlank())) {
                                                    // derive from chosen fist item
                                                    String chosenFistItemLocal = quyenContentIdFromForm != null && !quyenContentIdFromForm.isBlank()
                                                            ? quyenContentIdFromForm
                                                            : (fistItemIdFromForm != null && !fistItemIdFromForm.isBlank() ? fistItemIdFromForm : existingAthlete.getFistItemId());
                                                    if (chosenFistItemLocal != null && !chosenFistItemLocal.isBlank()) {
                                                        var item = fistItemRepository.findById(chosenFistItemLocal).orElse(null);
                                                        if (item != null && item.getVovinamFistConfig() != null) tryCfgId = item.getVovinamFistConfig().getId();
                                                    }
                                                }
                                                if (tryCfgId != null && !tryCfgId.isBlank()) {
                                                    var cfg = fistConfigRepository.findById(tryCfgId).orElse(null);
                                                    if (cfg != null && cfg.getName() != null && !cfg.getName().isBlank()) {
                                                        perfSubCompType = cfg.getName();
                                                    }
                                                }
                                            } catch (Exception ignoredCfg) { }
                                            if (perfSubCompType == null) perfSubCompType = "Quyền"; // fallback
                                        } else if (perfContentType == Performance.ContentType.FIGHTING) {
                                            perfSubCompType = "Hạng cân";
                                        } else if (perfContentType == Performance.ContentType.MUSIC) {
                                            perfSubCompType = "Tiết mục";
                                        }
                                        if (perfSubCompType != null) existingAthlete.setSubCompetitionType(perfSubCompType);
                                        
                                        if (finalFistConfigId != null && !finalFistConfigId.isBlank()) existingAthlete.setFistConfigId(finalFistConfigId);
                                        String chosenFistItem = quyenContentIdFromForm != null && !quyenContentIdFromForm.isBlank()
                                                ? quyenContentIdFromForm
                                                : (fistItemIdFromForm != null && !fistItemIdFromForm.isBlank() ? fistItemIdFromForm : null);
                                        if (chosenFistItem != null) existingAthlete.setFistItemId(chosenFistItem);
                                        if (finalMusicContentId != null && !finalMusicContentId.isBlank()) existingAthlete.setMusicContentId(finalMusicContentId);
                                        athleteService.create(existingAthlete);
                                    }
                                } catch (Exception ignoredUpsert) {}
                            }
                        } catch (Exception ignoredPerf) {}
                    } catch (Exception propagateEx) {
                        log.warn("Failed to propagate team performance updates for submission {}: {}", 
                                submissionId, propagateEx.getMessage(), propagateEx);
                    }
                }
                } catch (Exception ex) {
                    // Log error but don't fail the status update transaction
                    log.error("Error processing approval side-effects for submission {}: {}", 
                            submissionId, ex.getMessage(), ex);
                    // Don't re-throw - this is in a separate transaction, so status update already succeeded
                    // The exception will be logged but won't affect the main transaction
                }
            });
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void upsertAthleteAndRole(JsonNode root, sep490g65.fvcapi.entity.SubmittedApplicationForm s) {
        String fullName = textOrNull(root, "fullName");
        String email = textOrNull(root, "email");
        String club = textOrNull(root, "club");
        String competitionTypeStr = textOrNull(root, "competitionType");
        String genderStr = textOrNull(root, "gender");
        String studentId = textOrNull(root, "studentId");

        Athlete.Gender gender = parseGender(genderStr);
        Athlete.CompetitionType competitionType = parseCompetitionType(competitionTypeStr);

        String subCompetitionType = resolveSubCompetitionType(root, competitionTypeStr);

        String competitionId = null;
        if (s.getApplicationFormConfig() != null && s.getApplicationFormConfig().getCompetition() != null) {
            String compId = s.getApplicationFormConfig().getCompetition().getId();
            if (compId != null && !compId.isBlank()) {
                competitionId = compId;
            }
        }

        String perfIdForTeam = textOrNull(root, "performanceId");
        try {
            Integer ppe = root.hasNonNull("participantsPerEntry") ? root.get("participantsPerEntry").asInt() : null;
            boolean hasMembers = root.has("teamMembers") && root.get("teamMembers").isArray() && root.get("teamMembers").size() > 0;
            boolean _unused = (ppe != null && ppe > 1) || hasMembers || (perfIdForTeam != null && !perfIdForTeam.isBlank());
        } catch (Exception ignoredCalc) {}

        if (competitionId != null && fullName != null && email != null && gender != null && competitionType != null) {
            String weightClassId = textOrNull(root, "weightClassId");
            String fistItemId    = textOrNull(root, "fistItemId");
            if (fistItemId == null || fistItemId.isBlank()) {
                String qid = textOrNull(root, "quyenContentId");
                if (qid != null && !qid.isBlank()) fistItemId = qid;
            }
            String musicContentId= textOrNull(root, "musicContentId");
            String fistConfigId  = textOrNull(root, "fistConfigId");

            String subCompetitionTypeFinal = subCompetitionType;
            try {
                if (competitionType == Athlete.CompetitionType.quyen) {
                    String quyenCategoryFromForm = textOrNull(root, "quyenCategory");
                    if (quyenCategoryFromForm != null && !quyenCategoryFromForm.isBlank()) {
                        subCompetitionTypeFinal = quyenCategoryFromForm;
                    }
                    if (subCompetitionTypeFinal == null || subCompetitionTypeFinal.isBlank() || "Quyền".equalsIgnoreCase(subCompetitionTypeFinal)) {
                        if (fistConfigId != null && !fistConfigId.isBlank()) {
                            var cfg = fistConfigRepository.findById(fistConfigId).orElse(null);
                            if (cfg != null && cfg.getName() != null && !cfg.getName().isBlank()) {
                                subCompetitionTypeFinal = cfg.getName();
                            }
                        }
                    }
                }
            } catch (Exception ignoredResolveCfg) { }

            try { athleteService.deleteByEmailAndCompetitionId(email, competitionId); } catch (Exception ignoredDelete) { }

            try {
                Athlete.AthleteBuilder builder = Athlete.builder()
                    .competitionId(competitionId)
                    .fullName(fullName)
                    .email(email)
                    .studentId(studentId)
                    .gender(gender)
                    .club(club)
                    .competitionType(competitionType)
                    .subCompetitionType(subCompetitionTypeFinal)
                    .status(Athlete.AthleteStatus.NOT_STARTED);

                if (weightClassId != null && !weightClassId.isBlank()) builder.weightClassId(weightClassId);
                if (fistConfigId  != null && !fistConfigId.isBlank())  builder.fistConfigId(fistConfigId);
                if (musicContentId!= null && !musicContentId.isBlank()) builder.musicContentId(musicContentId);
                if (fistItemId != null && !fistItemId.isBlank()) builder.fistItemId(fistItemId);

                athleteService.create(builder.build());
            } catch (Exception ignoredCreateAthlete) { }

            try {
                Competition competition = competitionRepository.findById(competitionId).orElse(null);
                User user = userRepository.findByPersonalMail(email).orElse(null);
                if (competition != null) {
                    boolean roleExists = false;
                    if (user != null) {
                        roleExists = competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole(
                            competitionId, user.getId(), CompetitionRoleType.ATHLETE);
                    } else {
                        roleExists = competitionRoleRepository.existsByCompetitionIdAndEmailAndRole(
                            competitionId, email, CompetitionRoleType.ATHLETE);
                    }
                    if (!roleExists) {
                        CompetitionRole competitionRole = CompetitionRole.builder()
                            .competition(competition)
                            .user(user)
                            .email(email)
                            .role(CompetitionRoleType.ATHLETE)
                            .build();
                        try { competitionRoleRepository.save(competitionRole); } catch (Exception ignoredSaveRole) { }
                    }
                }
            } catch (Exception ignoredRole) { }
        }

        if (perfIdForTeam != null && !perfIdForTeam.isBlank()) {
            try { performanceService.approve(perfIdForTeam); } catch (Exception ignoredApprove) { }
            try {
                final String competitionIdFinal;
                if (s.getApplicationFormConfig() != null && s.getApplicationFormConfig().getCompetition() != null) {
                    competitionIdFinal = s.getApplicationFormConfig().getCompetition().getId();
                } else { return; }

                try {
                    PerformanceResponse perfResponse = performanceService.getPerformanceById(perfIdForTeam);
                    String performanceContentId = perfResponse.getContentId();
                    Performance.ContentType perfContentType = perfResponse.getContentType();

                    final String fistConfigIdFromForm = textOrNull(root, "fistConfigId");
                    final String quyenContentIdFromForm = textOrNull(root, "quyenContentId");
                    final String fistItemIdFromForm = textOrNull(root, "fistItemId");
                    final String musicContentIdFromForm = textOrNull(root, "musicContentId");

                    String finalFistConfigId = fistConfigIdFromForm;
                    String finalMusicContentId = musicContentIdFromForm;
                    if (perfContentType == Performance.ContentType.QUYEN && performanceContentId != null && !performanceContentId.isBlank()) {
                        finalFistConfigId = finalFistConfigId != null ? finalFistConfigId : performanceContentId;
                    } else if (perfContentType == Performance.ContentType.MUSIC && performanceContentId != null && !performanceContentId.isBlank()) {
                        finalMusicContentId = finalMusicContentId != null ? finalMusicContentId : performanceContentId;
                    }

                    java.util.Set<String> emails = new java.util.LinkedHashSet<>();
                    if (email != null && !email.isBlank()) emails.add(email);
                    try {
                        JsonNode members = root.get("teamMembers");
                        if (members != null && members.isArray()) {
                            for (JsonNode m : members) {
                                if (m.hasNonNull("email")) {
                                    String em = m.get("email").asText("").trim();
                                    if (!em.isBlank()) emails.add(em);
                                }
                            }
                        }
                    } catch (Exception ignoredMembers) {}

                    for (String em : emails) {
                        try {
                            java.util.Optional<sep490g65.fvcapi.entity.Athlete> existingOpt = 
                                    athleteService.list(competitionIdFinal, null, null, null, null, null, null, org.springframework.data.domain.Pageable.unpaged())
                                    .getContent()
                                    .stream().filter(a -> em.equalsIgnoreCase(a.getEmail())).findFirst();
                            if (existingOpt.isPresent()) {
                                Athlete existingAthlete = existingOpt.get();
                                Athlete.CompetitionType perfCompetitionType = Athlete.CompetitionType.fighting;
                                if (perfContentType == Performance.ContentType.QUYEN) {
                                    perfCompetitionType = Athlete.CompetitionType.quyen;
                                } else if (perfContentType == Performance.ContentType.MUSIC) {
                                    perfCompetitionType = Athlete.CompetitionType.music;
                                }
                                existingAthlete.setCompetitionType(perfCompetitionType);

                                String perfSubCompType = null;
                                if (perfContentType == Performance.ContentType.QUYEN) {
                                    try {
                                        String tryCfgId = null;
                                        if (finalFistConfigId != null && !finalFistConfigId.isBlank()) tryCfgId = finalFistConfigId;
                                        if ((tryCfgId == null || tryCfgId.isBlank()) && existingAthlete.getFistConfigId() != null) {
                                            tryCfgId = existingAthlete.getFistConfigId();
                                        }
                                        if ((tryCfgId == null || tryCfgId.isBlank())) {
                                            String chosenFistItemLocal = quyenContentIdFromForm != null && !quyenContentIdFromForm.isBlank()
                                                    ? quyenContentIdFromForm
                                                    : (fistItemIdFromForm != null && !fistItemIdFromForm.isBlank() ? fistItemIdFromForm : existingAthlete.getFistItemId());
                                            if (chosenFistItemLocal != null && !chosenFistItemLocal.isBlank()) {
                                                var item = fistItemRepository.findById(chosenFistItemLocal).orElse(null);
                                                if (item != null && item.getVovinamFistConfig() != null) tryCfgId = item.getVovinamFistConfig().getId();
                                            }
                                        }
                                        if (tryCfgId != null && !tryCfgId.isBlank()) {
                                            var cfg = fistConfigRepository.findById(tryCfgId).orElse(null);
                                            if (cfg != null && cfg.getName() != null && !cfg.getName().isBlank()) {
                                                perfSubCompType = cfg.getName();
                                            }
                                        }
                                    } catch (Exception ignoredCfg) { }
                                    if (perfSubCompType == null) perfSubCompType = "Quyền";
                                } else if (perfContentType == Performance.ContentType.FIGHTING) {
                                    perfSubCompType = "Hạng cân";
                                } else if (perfContentType == Performance.ContentType.MUSIC) {
                                    perfSubCompType = "Tiết mục";
                                }
                                if (perfSubCompType != null) existingAthlete.setSubCompetitionType(perfSubCompType);
                                if (finalFistConfigId != null && !finalFistConfigId.isBlank()) existingAthlete.setFistConfigId(finalFistConfigId);
                                String chosenFistItem = quyenContentIdFromForm != null && !quyenContentIdFromForm.isBlank()
                                        ? quyenContentIdFromForm
                                        : (fistItemIdFromForm != null && !fistItemIdFromForm.isBlank() ? fistItemIdFromForm : null);
                                if (chosenFistItem != null) existingAthlete.setFistItemId(chosenFistItem);
                                if (finalMusicContentId != null && !finalMusicContentId.isBlank()) existingAthlete.setMusicContentId(finalMusicContentId);
                                try { athleteService.create(existingAthlete); } catch (Exception ignoredUpsert) { }
                            }
                        } catch (Exception ignoredLoop) { }
                    }
                } catch (Exception ignoredPerf) { }
            } catch (Exception ignoredPropagate) { }
        }
    }

    @Override
    @Transactional
    public void submit(String formId, CreateSubmissionRequest request) {
        ApplicationFormConfig form = formConfigRepository.findById(formId).orElseThrow();
        // Basic validation for required standard fields
        if (request.getFullName() == null || request.getFullName().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getStudentId() == null || request.getStudentId().isBlank()
                || request.getGender() == null || request.getGender().isBlank()
                || request.getFormDataJson() == null || request.getFormDataJson().isBlank()) {
            throw new IllegalArgumentException("Missing required fields for submission");
        }

        // Enforce 1 email per form: check existing submissions by formId + email
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedStudentId = request.getStudentId().trim();
        
        // submittedRepository should expose a method to search by formId and email contained in formData
        // As a pragmatic approach, fetch minimal page and scan for match
        PageRequest onePage = PageRequest.of(0, 100);
        Page<sep490g65.fvcapi.entity.SubmittedApplicationForm> existing = submittedRepository.findByFormId(formId, onePage);
        
        // Check for duplicate email
        boolean duplicateEmail = existing.stream().anyMatch(s -> {
            try {
                String formJson = s.getFormData();
                if (formJson == null) return false;
                com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(formJson);
                String e = (node != null && node.hasNonNull("email")) ? node.get("email").asText("") : "";
                return !e.isBlank() && e.trim().toLowerCase().equals(normalizedEmail);
            } catch (Exception ex) {
                return false;
            }
        });
        if (duplicateEmail) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Email này đã được đăng ký cho form này"
            );
        }
        
        // Check for duplicate studentId
        boolean duplicateStudentId = existing.stream().anyMatch(s -> {
            try {
                String formJson = s.getFormData();
                if (formJson == null) return false;
                com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(formJson);
                String sid = (node != null && node.hasNonNull("studentId")) ? node.get("studentId").asText("") : "";
                return !sid.isBlank() && sid.trim().equals(normalizedStudentId);
            } catch (Exception ex) {
                return false;
            }
        });
        if (duplicateStudentId) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "MSSV này đã được đăng ký cho form này"
            );
        }
        // resolve user from email (only if exists, don't create new user)
        sep490g65.fvcapi.entity.User user = userRepository.findByPersonalMail(request.getEmail()).orElse(null);

        // Server-side validation: competitionType must be present and non-empty
        try {
            JsonNode validateRoot = objectMapper.readTree(request.getFormDataJson());
            String compType = (validateRoot != null && validateRoot.hasNonNull("competitionType"))
                    ? validateRoot.get("competitionType").asText("").trim()
                    : "";
            if (compType.isEmpty()) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Nội dung thi đấu (competitionType) là bắt buộc"
                );
            }
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Dữ liệu form không hợp lệ"
            );
        }

        // Reject submissions after endDate if configured
        try {
            java.time.LocalDateTime end = form.getEndDate();
            if (end != null && java.time.LocalDateTime.now().isAfter(end)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.GONE,
                        "Form đã hết hạn nộp đăng ký"
                );
            }
        } catch (org.springframework.web.server.ResponseStatusException ex) { throw ex; }

        sep490g65.fvcapi.entity.SubmittedApplicationForm s = sep490g65.fvcapi.entity.SubmittedApplicationForm.builder()
                .applicationFormConfig(form)
                .formType(form.getFormType())
                .formData(request.getFormDataJson())
                .user(user)
                .email(request.getEmail())
                .status(sep490g65.fvcapi.enums.ApplicationFormStatus.PENDING)
                .build();
        submittedRepository.save(s);

        // Create a Performance for team submissions (if applicable)
        // Use separate transaction to avoid rollback of main submission if performance creation fails
        try {
            JsonNode root = objectMapper.readTree(request.getFormDataJson());
            String competitionTypeStr = root.hasNonNull("competitionType") ? root.get("competitionType").asText("") : "";
            Integer participantsPerEntry = root.hasNonNull("participantsPerEntry") ? root.get("participantsPerEntry").asInt() : null;
            JsonNode membersNode = root.get("teamMembers");

            // Enrich readable fields in formData if only IDs are provided
            try {
                com.fasterxml.jackson.databind.node.ObjectNode obj = (com.fasterxml.jackson.databind.node.ObjectNode) objectMapper.readTree(s.getFormData());
                String ctLowerForEnrich = competitionTypeStr != null ? competitionTypeStr.toLowerCase() : "";
                if ("fighting".equals(ctLowerForEnrich)) {
                    if (!obj.hasNonNull("weightClass") && obj.hasNonNull("weightClassId")) {
                        String wId = obj.get("weightClassId").asText();
                        weightClassRepository.findById(wId).ifPresent(w -> {
                            String label;
                            if (w.getWeightClass() != null && !w.getWeightClass().trim().isEmpty()) {
                                label = w.getWeightClass();
                            } else if (w.getMinWeight() != null && w.getMaxWeight() != null) {
                                String min = w.getMinWeight().stripTrailingZeros().toPlainString();
                                String max = w.getMaxWeight().stripTrailingZeros().toPlainString();
                                label = min + "-" + max + "kg";
                            } else {
                                label = null;
                            }
                            if (label != null) obj.put("weightClass", label);
                        });
                    }
                } else if ("quyen".equals(ctLowerForEnrich)) {
                    // Ensure item ids are present in formData
                    if (!obj.hasNonNull("quyenContentId")) {
                        String fromReq = request.getFistItemId();
                        if (fromReq != null && !fromReq.isBlank()) obj.put("quyenContentId", fromReq);
                    }
                    if (!obj.hasNonNull("fistItemId")) {
                        String fromReq = request.getFistItemId();
                        if (fromReq != null && !fromReq.isBlank()) obj.put("fistItemId", fromReq);
                    }
                    if (!obj.hasNonNull("quyenCategory") && obj.hasNonNull("fistConfigId")) {
                        String cfgId = obj.get("fistConfigId").asText();
                        fistConfigRepository.findById(cfgId).ifPresent(cfg -> obj.put("quyenCategory", cfg.getName()));
                    }
                    if (!obj.hasNonNull("quyenContent") && obj.hasNonNull("quyenContentId")) {
                        String itemId = obj.get("quyenContentId").asText();
                        fistItemRepository.findById(itemId).ifPresent(it -> obj.put("quyenContent", it.getName()));
                    }
                    if (!obj.hasNonNull("quyenContent") && obj.hasNonNull("fistItemId")) {
                        String itemId2 = obj.get("fistItemId").asText();
                        fistItemRepository.findById(itemId2).ifPresent(it -> obj.put("quyenContent", it.getName()));
                    }
                } else if ("music".equals(ctLowerForEnrich)) {
                    if (!obj.hasNonNull("musicCategory") && obj.hasNonNull("musicContentId")) {
                        String mid = obj.get("musicContentId").asText();
                        musicRepository.findById(mid).ifPresent(m -> obj.put("musicCategory", m.getName()));
                    }
                }
                s.setFormData(obj.toString());
                submittedRepository.save(s);
            } catch (Exception ignoredEnrich) {}

            boolean isTeam = (participantsPerEntry != null && participantsPerEntry > 1) || (membersNode != null && membersNode.isArray() && membersNode.size() > 0);
            if (isTeam && form.getCompetition() != null) {
                CreatePerformanceRequest.CreatePerformanceRequestBuilder b = CreatePerformanceRequest.builder()
                        .competitionId(form.getCompetition().getId())
                        .isTeam(true)
                        .teamId(java.util.UUID.randomUUID().toString())
                        .teamName(root.hasNonNull("teamName") ? root.get("teamName").asText() : null)
                        .participantsPerEntry(participantsPerEntry)
                        .performanceType(Performance.PerformanceType.TEAM);

                // content type + content id
                String contentId = null;
                Performance.ContentType ct = Performance.ContentType.FIGHTING;
                String ctLower = competitionTypeStr != null ? competitionTypeStr.toLowerCase() : "";
                if ("quyen".equals(ctLower)) {
                    ct = Performance.ContentType.QUYEN;
                    contentId = root.hasNonNull("fistConfigId") ? root.get("fistConfigId").asText() : null;
                } else if ("music".equals(ctLower)) {
                    ct = Performance.ContentType.MUSIC;
                    contentId = root.hasNonNull("musicContentId") ? root.get("musicContentId").asText() : null;
                } else {
                    ct = Performance.ContentType.FIGHTING;
                }
                b.contentType(ct).contentId(contentId);

                // Push denormalized IDs into Performance for FE consumption
                try {
                    // Prefer explicit IDs from request body; fallback to formData JSON
                    String fistConfigIdVal = request.getFistConfigId() != null && !request.getFistConfigId().isBlank()
                            ? request.getFistConfigId()
                            : (root.hasNonNull("fistConfigId") ? root.get("fistConfigId").asText() : null);

                    String fistItemIdVal = request.getFistItemId() != null && !request.getFistItemId().isBlank()
                            ? request.getFistItemId()
                            : (root.hasNonNull("fistItemId") ? root.get("fistItemId").asText()
                               : (root.hasNonNull("quyenContentId") ? root.get("quyenContentId").asText() : null));

                    String musicContentIdVal = request.getMusicContentId() != null && !request.getMusicContentId().isBlank()
                            ? request.getMusicContentId()
                            : (root.hasNonNull("musicContentId") ? root.get("musicContentId").asText() : null);

                    b.fistConfigId(fistConfigIdVal)
                     .fistItemId(fistItemIdVal)
                     .musicContentId(musicContentIdVal);
                } catch (Exception ignoredSetIds) {}

                // team members
                if (isTeam) {
                    java.util.List<CreatePerformanceRequest.MemberDto> members = new java.util.ArrayList<>();
                    // 1) Thêm người nộp chính (các trường chuẩn từ request)
                    members.add(CreatePerformanceRequest.MemberDto.builder()
                            .fullName(request.getFullName())
                            .email(request.getEmail())
                            .phone(null)
                            .gender(request.getGender())
                            .build());
                    // 2) Thêm các thành viên bổ sung từ JSON
                    if (membersNode != null && membersNode.isArray()) {
                        for (JsonNode m : membersNode) {
                            CreatePerformanceRequest.MemberDto dto = CreatePerformanceRequest.MemberDto.builder()
                                    .fullName(m.hasNonNull("fullName") ? m.get("fullName").asText() : null)
                                    .studentId(m.hasNonNull("studentId") ? m.get("studentId").asText() : null)
                                    .email(m.hasNonNull("email") ? m.get("email").asText() : null)
                                    .phone(m.hasNonNull("phone") ? m.get("phone").asText() : null)
                                    .gender(m.hasNonNull("gender") ? m.get("gender").asText() : null)
                                    .build();
                            members.add(dto);
                        }
                    }
                    b.teamMembers(members);
                }

                // createPerformance uses REQUIRES_NEW propagation, so it won't affect main transaction
                sep490g65.fvcapi.dto.response.PerformanceResponse perf = performanceService.createPerformance(b.build());
                // Ghi lại performanceId/teamId vào form_data để FE tra cứu FormResult mà không cần migration
                try {
                    com.fasterxml.jackson.databind.node.ObjectNode obj = (com.fasterxml.jackson.databind.node.ObjectNode) objectMapper.readTree(s.getFormData());
                    obj.put("performanceId", perf.getId());
                    if (perf.getTeamId() != null) obj.put("teamId", perf.getTeamId());
                    s.setFormData(obj.toString());
                    submittedRepository.save(s);
                } catch (Exception ignored2) {
                    // Log if needed but don't fail submission
                }
            }
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            // Re-throw ResponseStatusException to maintain proper HTTP status
            throw ex;
        } catch (Exception ex) {
            // Log error but don't fail submission - performance creation is optional enhancement
            // The submission itself should succeed even if performance creation fails
            log.warn("Failed to create Performance for team submission, but submission will continue: {}", ex.getMessage());
        }

        // Optionally pre-create/update an Athlete record with tight linking IDs (pending approval)
        // We keep existing approval flow; IDs will be used on approval to upsert athlete.
    }

    private TournamentFormResponse toDtoFromForm(ApplicationFormConfig f) {
        Competition c = f.getCompetition();
        String status = formStatusToString(f.getStatus(), c);
        long participants = submittedRepository.countByFormId(f.getId());
        return TournamentFormResponse.builder()
                .id(f.getId())
                .competitionId(c != null ? c.getId() : null)
                .tournamentName(c != null ? c.getName() : null)
                .formTitle(f.getName())
                .description(f.getDescription())
                .formType(f.getFormType() != null ? f.getFormType().toString() : null)
                .numberOfParticipants((int) participants)
                .createdAt(f.getCreatedAt())
                .status(status)
                .build();
    }

    private String formStatusToString(sep490g65.fvcapi.enums.FormStatus formStatus, Competition c) {
        if (formStatus != null) {
            switch (formStatus) {
                case DRAFT: return "draft";
                case PUBLISH: return "publish";
                case ARCHIVED: return "archived";
                case POSTPONE: return "postpone";
            }
        }
        if (c == null) return "draft";
        return resolveStatus(c);
    }

    private Athlete.Gender parseGender(String value) {
        if (value == null) return null;
        String v = value.trim().toUpperCase();
        if ("MALE".equals(v) || "NAM".equals(v)) return Athlete.Gender.MALE;
        if ("FEMALE".equals(v) || "NỮ".equals(v) || "NU".equals(v)) return Athlete.Gender.FEMALE;
        return null;
    }

    private Athlete.CompetitionType parseCompetitionType(String value) {
        if (value == null) return null;
        String v = value.trim().toLowerCase();
        try {
            return Athlete.CompetitionType.valueOf(v);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String textOrNull(JsonNode node, String field) {
        return (node != null && node.hasNonNull(field)) ? node.get(field).asText() : null;
    }


    private String resolveSubCompetitionType(JsonNode root, String competitionTypeStr) {
        if (competitionTypeStr == null) return null;
        String ct = competitionTypeStr.trim().toLowerCase();
        
        switch (ct) {
            case "fighting":
                return "Hạng cân";
            case "quyen":
                return textOrNull(root, "quyenCategory"); // Song luyện, Đa luyện
            case "music":
                return "Tiết mục";
            default:
                return null;
        }
    }

    private String resolveDetailSubCompetitionType(JsonNode root, String competitionTypeStr) {
        if (competitionTypeStr == null) return null;
        String ct = competitionTypeStr.trim().toLowerCase();
        
        switch (ct) {
            case "fighting":
                String weightClass = textOrNull(root, "weightClass");
                String gender = textOrNull(root, "gender");
                if (weightClass != null && !weightClass.isBlank()) {
                    String genderDisplay = "MALE".equals(gender) ? "Nam" : "FEMALE".equals(gender) ? "Nữ" : "";
                    return genderDisplay.isEmpty() ? weightClass : genderDisplay + " " + weightClass;
                }
                return null;
            case "quyen":
                return textOrNull(root, "quyenContent"); // Song luyện 1, Đa luyện 2
            case "music":
                return textOrNull(root, "musicCategory"); // Võ nhạc 1, etc.
            default:
                return null;
        }
    }


    private String resolveContent(JsonNode root, String competitionTypeStr) {
        String ct = competitionTypeStr != null ? competitionTypeStr.trim().toLowerCase() : null;
        
        // Build hierarchical content display
        if ("quyen".equals(ct)) {
            String category = textOrNull(root, "quyenCategory"); // Song luyện, Đa luyện
            String content = textOrNull(root, "quyenContent"); // Song luyện 1, Đa luyện 2
            
            if (category != null && !category.isBlank() && content != null && !content.isBlank()) {
                return "Quyền - " + category + " - " + content;
            }
            if (content != null && !content.isBlank()) {
                return "Quyền - " + content;
            }
            if (category != null && !category.isBlank()) {
                return "Quyền - " + category;
            }
            return "Quyền";
            
        } else if ("music".equals(ct)) {
            String mc = textOrNull(root, "musicCategory");
            if (mc != null && !mc.isBlank()) {
                return "Võ nhạc - " + mc;
            }
            return "Võ nhạc";
            
        } else if ("fighting".equals(ct)) {
            String wc = textOrNull(root, "weightClass");
            String gender = textOrNull(root, "gender");
            
            if (wc != null && !wc.isBlank()) {
                String genderDisplay = "MALE".equals(gender) ? "Nam" : "FEMALE".equals(gender) ? "Nữ" : "";
                if (!genderDisplay.isEmpty()) {
                    return "Đối kháng - Hạng cân - " + genderDisplay + " " + wc;
                }
                return "Đối kháng - Hạng cân - " + wc;
            }
            return "Đối kháng";
        }
        // Try multiple known keys from form results mapping
        String[] keys = new String[]{
                "content",
                "contentName",
                "quyenContentName",
                "quyenContent",
                "quyenCategory",
                "fistContent",
                "fistItem",
                "fistItemName",
                "weightClass",
                "musicCategory",
                "category"
        };
        for (String k : keys) {
            String v = textOrNull(root, k);
            if (v != null && !v.isBlank()) return v;
        }
        // Fallback: if a nested object/array holds a displayable name
        if (root != null && root.has("quyenContent")) {
            JsonNode q = root.get("quyenContent");
            if (q.isObject()) {
                String v = firstStringFromObject(q);
                if (v != null && !v.isBlank()) return v;
            } else if (q.isArray() && q.size() > 0) {
                JsonNode first = q.get(0);
                String v = firstStringFromObject(first);
                if (v != null && !v.isBlank()) return v;
            }
        }
        return null;
    }

    private String generateUniqueSlug(String base) {
        // Generate a secure, encrypted slug using Base64 URL-safe encoding
        // Combines two UUIDs (32 bytes = 256 bits entropy) for maximum security
        // The link will be hard to guess and appears encrypted
        java.util.Base64.Encoder encoder = java.util.Base64.getUrlEncoder().withoutPadding();
        String candidate;
        int attempts = 0;
        
        do {
            java.util.UUID uuid1 = java.util.UUID.randomUUID();
            java.util.UUID uuid2 = java.util.UUID.randomUUID();
            
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
                candidate = "f" + java.util.UUID.randomUUID().toString().replace("-", "");
                break;
            }
        } while (formConfigRepository.existsByPublicSlug(candidate));
        
        return candidate;
    }

    private String firstStringFromObject(JsonNode node) {
        if (node == null) return null;
        if (node.hasNonNull("name")) return node.get("name").asText();
        if (node.hasNonNull("title")) return node.get("title").asText();
        if (node.hasNonNull("label")) return node.get("label").asText();
        // iterate keys
        java.util.Iterator<String> it = node.fieldNames();
        while (it.hasNext()) {
            String k = it.next();
            JsonNode v = node.get(k);
            if (v.isTextual() && !v.asText().isBlank()) return v.asText();
        }
        return null;
    }
}



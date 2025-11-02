package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.TournamentFormResponse;
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
import sep490g65.fvcapi.dto.response.FormDetailResponse;
import sep490g65.fvcapi.dto.response.FormFieldDto;
import sep490g65.fvcapi.dto.request.CreateSubmissionRequest;
import sep490g65.fvcapi.service.AthleteService;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.entity.CompetitionRole;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.CompetitionRoleType;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TournamentFormServiceImpl implements TournamentFormService {

    private final CompetitionRepository competitionRepository;
    private final ApplicationFormConfigRepository formConfigRepository;
    private final SubmittedApplicationFormRepository submittedRepository;
    private final UserRepository userRepository;
    private final AthleteService athleteService;
    private final CompetitionRoleRepository competitionRoleRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

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
        Competition comp = competitionRepository.findById(request.getCompetitionId()).orElseThrow();
        // Enforce one form per competition
        long existingCount = formConfigRepository.countByCompetition_Id(comp.getId());
        if (existingCount > 0) {
            throw new IllegalStateException("A form already exists for competition: " + comp.getId());
        }
        ApplicationFormConfig form = ApplicationFormConfig.builder()
                .name(request.getName())
                .description(request.getDescription())
                .formType(request.getFormType())
                .competition(comp)
                .status(request.getStatus() != null ? request.getStatus() : sep490g65.fvcapi.enums.FormStatus.DRAFT)
                .build();

        // attach fields if provided
        if (request.getFields() != null && !request.getFields().isEmpty()) {
            java.util.List<sep490g65.fvcapi.entity.ApplicationFormField> fieldEntities = new java.util.ArrayList<>();
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

        ApplicationFormConfig saved = formConfigRepository.save(form);
        return toDtoFromForm(saved);
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
                .createdAt(f.getCreatedAt())
                .fields(fields)
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
    public PaginationResponse<sep490g65.fvcapi.dto.response.SubmittedFormResponse> listSubmissions(String formId, RequestParam params) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        Page<sep490g65.fvcapi.entity.SubmittedApplicationForm> page = submittedRepository.findByFormId(formId, pageable);
        Page<sep490g65.fvcapi.dto.response.SubmittedFormResponse> mapped = page.map(s -> sep490g65.fvcapi.dto.response.SubmittedFormResponse.builder()
                .id(s.getId())
                .formData(s.getFormData())
                .status(s.getStatus())
                .build());
        return ResponseUtils.createPaginatedResponse(mapped);
    }

    @Override
    @Transactional
    public void updateSubmissionStatus(Long submissionId, sep490g65.fvcapi.enums.ApplicationFormStatus status) {
        sep490g65.fvcapi.entity.SubmittedApplicationForm s = submittedRepository.findById(submissionId).orElseThrow();
        s.setStatus(status);
        submittedRepository.save(s);

        // On approval, upsert an athlete based on submission data
        if (status == ApplicationFormStatus.APPROVED) {
            try {
                String formJson = s.getFormData();
                JsonNode root = formJson != null ? objectMapper.readTree(formJson) : objectMapper.createObjectNode();

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

                String tournamentId = null;
                if (s.getApplicationFormConfig() != null && s.getApplicationFormConfig().getCompetition() != null) {
                    String compId = s.getApplicationFormConfig().getCompetition().getId();
                    if (compId != null && !compId.isBlank()) {
                        tournamentId = compId;
                    }
                }

                if (tournamentId != null && fullName != null && email != null && gender != null && competitionType != null) {
                // Extract preferred IDs for tight linking and storing into detail_sub
                String weightClassId = textOrNull(root, "weightClassId");
                String fistItemId    = textOrNull(root, "fistItemId");
                String musicContentId= textOrNull(root, "musicContentId");

                Athlete.AthleteBuilder builder = Athlete.builder()
                        .tournamentId(tournamentId)
                        .fullName(fullName)
                        .email(email)
                        .studentId(studentId)
                        .gender(gender)
                        .club(club)
                        .competitionType(competitionType)
                        .subCompetitionType(subCompetitionType)
                        .status(Athlete.AthleteStatus.NOT_STARTED);

                    // Prefer IDs from submission formData for FK columns
                    String fistConfigId  = textOrNull(root, "fistConfigId");

                    if (weightClassId != null && !weightClassId.isBlank()) builder.weightClassId(weightClassId);
                    if (fistConfigId  != null && !fistConfigId.isBlank())  builder.fistConfigId(fistConfigId);
                    // Stop persisting fistItemId per requirement; rely on fistConfigId only for Quyền labels
                    if (musicContentId!= null && !musicContentId.isBlank()) builder.musicContentId(musicContentId);

                    Athlete athlete = athleteService.upsert(builder.build());
                    
                    // Create CompetitionRole for the athlete (always create)
                    Competition competition = competitionRepository.findById(tournamentId).orElse(null);
                    User user = userRepository.findByPersonalMail(email).orElse(null);
                    
                    if (competition != null) {
                        // Check if CompetitionRole already exists
                        boolean roleExists = false;
                        if (user != null) {
                            roleExists = competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole(
                                tournamentId, user.getId(), CompetitionRoleType.ATHLETE);
                        } else {
                            // For non-system users, check by email
                            roleExists = competitionRoleRepository.existsByCompetitionIdAndEmailAndRole(
                                tournamentId, email, CompetitionRoleType.ATHLETE);
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
            } catch (Exception ignored) {
                // Intentionally ignore to avoid breaking approval flow; consider logging if needed
            }
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

        sep490g65.fvcapi.entity.SubmittedApplicationForm s = sep490g65.fvcapi.entity.SubmittedApplicationForm.builder()
                .applicationFormConfig(form)
                .formType(form.getFormType())
                .formData(request.getFormDataJson())
                .user(user)
                .email(request.getEmail())
                .status(sep490g65.fvcapi.enums.ApplicationFormStatus.PENDING)
                .build();
        submittedRepository.save(s);

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



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
import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.service.TournamentFormService;
import sep490g65.fvcapi.utils.ResponseUtils;
import sep490g65.fvcapi.dto.request.CreateFormRequest;
import sep490g65.fvcapi.dto.request.UpdateFormRequest;
import sep490g65.fvcapi.dto.response.FormDetailResponse;
import sep490g65.fvcapi.dto.response.FormFieldDto;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TournamentFormServiceImpl implements TournamentFormService {

    private final CompetitionRepository competitionRepository;
    private final ApplicationFormConfigRepository formConfigRepository;
    private final SubmittedApplicationFormRepository submittedRepository;

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
        if (c.getStatus() != null) {
            FormStatus s = c.getStatus();
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
                if (!"TEXT".equalsIgnoreCase(up.getFieldType())) {
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
                if (!"TEXT".equalsIgnoreCase(fld.getFieldType())) {
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
        ApplicationFormConfig f = formConfigRepository.findById(id).orElseThrow();
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
                if (!"TEXT".equalsIgnoreCase(up.getFieldType())) {
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
}



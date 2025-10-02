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



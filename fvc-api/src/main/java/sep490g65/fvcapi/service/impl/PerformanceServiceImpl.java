package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.CreatePerformanceRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.*;
import sep490g65.fvcapi.repository.*;
import sep490g65.fvcapi.service.PerformanceService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerformanceServiceImpl implements PerformanceService {

    private final PerformanceRepository performanceRepository;
    private final PerformanceAthleteRepository performanceAthleteRepository;
    private final AthleteRepository athleteRepository;
    private final CompetitionRepository competitionRepository;
    private final AssessorRepository assessorRepository;
    private final AssessorScoreRepository assessorScoreRepository;
    private final sep490g65.fvcapi.repository.VovinamFistConfigRepository vovinamFistConfigRepository;
    private final SubmittedApplicationFormRepository submittedApplicationFormRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public PerformanceResponse createPerformance(CreatePerformanceRequest request) {
        // Validate competition exists
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        // Create performance
        Performance performance = Performance.builder()
                .competition(competition)
                .isTeam(request.getIsTeam())
                .teamId(request.getTeamId())
                .teamName(request.getTeamName())
                .participantsPerEntry(request.getParticipantsPerEntry())
                .performanceType(request.getPerformanceType())
                .contentType(request.getContentType())
                .contentId(request.getContentId())
                .fistConfigId(request.getFistConfigId())
                .fistItemId(request.getFistItemId())
                .musicContentId(request.getMusicContentId())
                .status(Performance.PerformanceStatus.PENDING)
                .build();

        Performance savedPerformance = performanceRepository.save(performance);

        // Add athletes if provided
        if (request.getAthleteIds() != null && !request.getAthleteIds().isEmpty()) {
            for (int i = 0; i < request.getAthleteIds().size(); i++) {
                String athleteId = request.getAthleteIds().get(i);
                Integer teamPosition = request.getTeamPositions() != null && i < request.getTeamPositions().size() 
                    ? request.getTeamPositions().get(i) : i + 1;
                Boolean isCaptain = request.getIsCaptains() != null && i < request.getIsCaptains().size() 
                    ? request.getIsCaptains().get(i) : false;

                addAthleteToPerformance(savedPerformance.getId(), athleteId, teamPosition, isCaptain);
            }
        }

        // Add pending members if provided (team submission)
        if (request.getTeamMembers() != null && !request.getTeamMembers().isEmpty()) {
            for (CreatePerformanceRequest.MemberDto m : request.getTeamMembers()) {
                PerformanceAthlete pa = PerformanceAthlete.builder()
                        .performance(savedPerformance)
                        .tempFullName(m.getFullName())
                        .tempStudentId(m.getStudentId())
                        .tempEmail(m.getEmail())
                        .tempPhone(m.getPhone())
                        .tempGender(m.getGender())
                        .build();
                performanceAthleteRepository.save(pa);
            }
        }

        return convertToResponse(savedPerformance);
    }

    @Override
    public PerformanceResponse getPerformanceById(String id) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        return convertToResponse(performance);
    }

    @Override
    public List<PerformanceResponse> getPerformancesByCompetitionId(String competitionId) {
        List<Performance> performances = performanceRepository.findByCompetitionId(competitionId);
        return performances.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceResponse> getPerformancesByCompetitionIdAndType(String competitionId, Performance.PerformanceType performanceType) {
        List<Performance> performances = performanceRepository.findByCompetitionIdAndPerformanceType(competitionId, performanceType);
        return performances.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceResponse> getPerformancesByCompetitionIdAndContentType(String competitionId, Performance.ContentType contentType) {
        List<Performance> performances = performanceRepository.findByCompetitionIdAndContentType(competitionId, contentType);
        return performances.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PerformanceResponse updatePerformanceStatus(String id, Performance.PerformanceStatus status) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        
        performance.setStatus(status);
        
        if (status == Performance.PerformanceStatus.IN_PROGRESS) {
            performance.setStartTime(LocalDateTime.now());
        } else if (status == Performance.PerformanceStatus.COMPLETED) {
            performance.setEndTime(LocalDateTime.now());
        }
        
        Performance savedPerformance = performanceRepository.save(performance);
        return convertToResponse(savedPerformance);
    }

    @Override
    @Transactional
    public PerformanceResponse startPerformance(String id) {
        return updatePerformanceStatus(id, Performance.PerformanceStatus.IN_PROGRESS);
    }

    @Override
    @Transactional
    public PerformanceResponse completePerformance(String id) {
        return updatePerformanceStatus(id, Performance.PerformanceStatus.COMPLETED);
    }

    @Override
    @Transactional
    public PerformanceResponse cancelPerformance(String id) {
        return updatePerformanceStatus(id, Performance.PerformanceStatus.CANCELLED);
    }

    @Override
    @Transactional
    public void deletePerformance(String id) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        performanceRepository.delete(performance);
    }

    @Override
    @Transactional
    public PerformanceResponse addAthleteToPerformance(String performanceId, String athleteId, Integer teamPosition, Boolean isCaptain) {
        Performance performance = performanceRepository.findById(performanceId)
                .orElseThrow(() -> new RuntimeException("Performance not found"));
        
        Athlete athlete = athleteRepository.findById(java.util.UUID.fromString(athleteId))
                .orElseThrow(() -> new RuntimeException("Athlete not found"));

        PerformanceAthlete performanceAthlete = PerformanceAthlete.builder()
                .performance(performance)
                .athlete(athlete)
                .build();

        performanceAthleteRepository.save(performanceAthlete);
        
        return convertToResponse(performance);
    }

    @Override
    @Transactional
    public void removeAthleteFromPerformance(String performanceId, String athleteId) {
        PerformanceAthlete performanceAthlete = performanceAthleteRepository
                .findByPerformanceIdAndAthleteId(performanceId, java.util.UUID.fromString(athleteId))
                .orElseThrow(() -> new RuntimeException("Athlete not found in performance"));
        
        performanceAthleteRepository.delete(performanceAthlete);
    }

    @Override
    @Transactional
    public PerformanceResponse approve(String id) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Performance not found"));

        // Process all rows: create missing athletes or update existing athletes' fields
        List<PerformanceAthlete> rows = performanceAthleteRepository.findByPerformanceId(id);

        // Precompute team-level fallback for subCompetitionType (especially for Quyền when IDs are missing)
        String teamSubCompetitionTypeFallback = null;
        // 1) Try derive from performance content IDs (preferred)
        if (performance.getContentType() == Performance.ContentType.QUYEN) {
            String cfgIdForName = performance.getContentId() != null && !performance.getContentId().isBlank()
                    ? performance.getContentId()
                    : performance.getFistConfigId();
            if (cfgIdForName != null && !cfgIdForName.isBlank()) {
                sep490g65.fvcapi.entity.VovinamFistConfig cfg = vovinamFistConfigRepository.findById(cfgIdForName).orElse(null);
                if (cfg != null && cfg.getName() != null && !cfg.getName().isBlank()) {
                    teamSubCompetitionTypeFallback = cfg.getName();
                }
            }
            // If still missing, set a generic non-null label for Quyền
            if (teamSubCompetitionTypeFallback == null) {
                // Try derive from submitted form JSON (quyenCategory) using performanceId saved at submit()
                try {
                    java.util.Optional<SubmittedApplicationForm> subOpt = submittedApplicationFormRepository.findOneByPerformanceId(performance.getId());
                    if (subOpt.isPresent()) {
                        String formJson = subOpt.get().getFormData();
                        if (formJson != null && !formJson.isBlank()) {
                            JsonNode root = objectMapper.readTree(formJson);
                            if (root.hasNonNull("quyenCategory")) {
                                String qc = root.get("quyenCategory").asText();
                                if (qc != null && !qc.isBlank()) {
                                    teamSubCompetitionTypeFallback = qc;
                                }
                            }
                        }
                    }
                } catch (Exception ignoredJson) {}
                if (teamSubCompetitionTypeFallback == null) teamSubCompetitionTypeFallback = "Quyền";
            }
        } else if (performance.getContentType() == Performance.ContentType.FIGHTING) {
            teamSubCompetitionTypeFallback = "Hạng cân";
        } else if (performance.getContentType() == Performance.ContentType.MUSIC) {
            teamSubCompetitionTypeFallback = "Tiết mục";
        }
        // 2) If still null, reuse any existing linked athlete's subCompetitionType in the team
        if (teamSubCompetitionTypeFallback == null) {
            for (PerformanceAthlete paProbe : rows) {
                if (paProbe.getAthlete() != null && paProbe.getAthlete().getSubCompetitionType() != null && !paProbe.getAthlete().getSubCompetitionType().isBlank()) {
                    teamSubCompetitionTypeFallback = paProbe.getAthlete().getSubCompetitionType();
                    break;
                }
            }
        }
        for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
            PerformanceAthlete pa = rows.get(rowIndex);
            try {
                    // Create athlete from temp fields
                    Athlete.Gender g = null;
                    if (pa.getTempGender() != null) {
                        String gg = pa.getTempGender().trim().toUpperCase();
                        if ("MALE".equals(gg) || "NAM".equals(gg)) g = Athlete.Gender.MALE;
                        if ("FEMALE".equals(gg) || "NU".equals(gg) || "NỮ".equals(gg)) g = Athlete.Gender.FEMALE;
                    }

                    // Minimal required fields: fullName + email
                    String name = pa.getTempFullName();
                    String email = pa.getTempEmail();
                Athlete athlete = pa.getAthlete();

                if (athlete == null) {
                    if (name == null || name.isBlank()) {
                        // skip incomplete member silently
                        continue;
                    }

                    // Reuse existing athlete by (tournamentId, email) to avoid unique constraint violation
                    // Ensure DB non-null constraint on email: synthesize internal email if missing
                    if (email == null || email.isBlank()) {
                        String normalized = name != null ? name.trim().toLowerCase().replaceAll("[^a-z0-9]+", ".") : "member";
                        String suffix = performance.getId() != null ? performance.getId() : java.util.UUID.randomUUID().toString();
                        email = normalized + "+" + suffix + "+" + (rowIndex + 1) + "@team.local";
                    }

                    java.util.Optional<Athlete> existing = athleteRepository
                            .findByTournamentIdAndEmail(performance.getCompetition().getId(), email);
                    if (existing.isPresent()) {
                        athlete = existing.get();
                    } else {
                        Athlete.CompetitionType ct = Athlete.CompetitionType.fighting;
                        if (performance.getContentType() == Performance.ContentType.QUYEN) ct = Athlete.CompetitionType.quyen;
                        else if (performance.getContentType() == Performance.ContentType.MUSIC) ct = Athlete.CompetitionType.music;
                        String subCompType = null;
                        if (performance.getContentType() == Performance.ContentType.QUYEN) {
                            // Prefer contentId; fallback to fistConfigId
                            String cfgId = performance.getContentId() != null && !performance.getContentId().isBlank()
                                    ? performance.getContentId()
                                    : performance.getFistConfigId();
                            VovinamFistConfig config = cfgId != null ?
                                    vovinamFistConfigRepository.findById(cfgId).orElse(null) : null;
                            if (config != null) subCompType = config.getName();
                        } else if (performance.getContentType() == Performance.ContentType.FIGHTING) {
                            subCompType = "Hạng cân";
                        } else if (performance.getContentType() == Performance.ContentType.MUSIC) {
                            subCompType = "Tiết mục";
                        }
                        if ((subCompType == null || subCompType.isBlank()) && teamSubCompetitionTypeFallback != null && !teamSubCompetitionTypeFallback.isBlank()) {
                            subCompType = teamSubCompetitionTypeFallback;
                        }

                        athlete = Athlete.builder()
                                .tournamentId(performance.getCompetition().getId())
                                .fullName(name)
                                .email(email)
                                .studentId(pa.getTempStudentId())
                                .gender(g != null ? g : Athlete.Gender.MALE)
                                .competitionType(ct)
                                .subCompetitionType(subCompType)
                                .status(Athlete.AthleteStatus.NOT_STARTED)
                                .build();
                        if (performance.getContentType() == Performance.ContentType.QUYEN && performance.getContentId() != null) {
                            athlete.setFistConfigId(performance.getContentId());
                        }
                        athlete = athleteRepository.save(athlete);
                    }
                }

                // Ensure fields for both new and existing linked athletes
                boolean dirty = false;
                // Sync studentId from pending row if provided (overwrite if different)
                if (pa.getTempStudentId() != null && !pa.getTempStudentId().isBlank()) {
                    if (athlete.getStudentId() == null || !pa.getTempStudentId().equals(athlete.getStudentId())) {
                        athlete.setStudentId(pa.getTempStudentId());
                        dirty = true;
                    }
                }
                if (athlete.getCompetitionType() == null) {
                    Athlete.CompetitionType ctFix = Athlete.CompetitionType.fighting;
                    if (performance.getContentType() == Performance.ContentType.QUYEN) ctFix = Athlete.CompetitionType.quyen;
                    else if (performance.getContentType() == Performance.ContentType.MUSIC) ctFix = Athlete.CompetitionType.music;
                    athlete.setCompetitionType(ctFix);
                    dirty = true;
                }
                if (performance.getContentType() == Performance.ContentType.QUYEN) {
                    // Force-sync team members to performance content IDs so all members have the same content
                    if (performance.getContentId() != null && !performance.getContentId().isBlank()) {
                        if (!performance.getContentId().equals(athlete.getFistConfigId())) {
                            athlete.setFistConfigId(performance.getContentId());
                            dirty = true;
                        }
                    }
                    if (performance.getFistItemId() != null && !performance.getFistItemId().isBlank()) {
                        if (!performance.getFistItemId().equals(athlete.getFistItemId())) {
                            athlete.setFistItemId(performance.getFistItemId());
                            dirty = true;
                        }
                    }
                    // Always set subCompetitionType to config name for Quyền (prefer contentId, fallback to fistConfigId)
                    String cfgIdForName = performance.getContentId() != null && !performance.getContentId().isBlank()
                            ? performance.getContentId()
                            : performance.getFistConfigId();
                    VovinamFistConfig config = cfgIdForName != null ?
                            vovinamFistConfigRepository.findById(cfgIdForName).orElse(null) : null;
                    if (config != null && config.getName() != null && !config.getName().isBlank()) {
                        if (!config.getName().equals(athlete.getSubCompetitionType())) {
                            athlete.setSubCompetitionType(config.getName());
                            dirty = true;
                        }
                    } else if ((athlete.getSubCompetitionType() == null || athlete.getSubCompetitionType().isBlank())
                            && teamSubCompetitionTypeFallback != null && !teamSubCompetitionTypeFallback.isBlank()) {
                        athlete.setSubCompetitionType(teamSubCompetitionTypeFallback);
                        dirty = true;
                    }
                } else if (performance.getContentType() == Performance.ContentType.FIGHTING) {
                    if (!"Hạng cân".equals(athlete.getSubCompetitionType())) {
                        athlete.setSubCompetitionType("Hạng cân");
                        dirty = true;
                    }
                } else if (performance.getContentType() == Performance.ContentType.MUSIC) {
                    if (!"Tiết mục".equals(athlete.getSubCompetitionType())) {
                        athlete.setSubCompetitionType("Tiết mục");
                        dirty = true;
                    }
                }

                // Music: propagate musicContentId from Performance to every athlete in team
                if (performance.getContentType() == Performance.ContentType.MUSIC) {
                    if (performance.getMusicContentId() != null && !performance.getMusicContentId().isBlank()) {
                        if (!performance.getMusicContentId().equals(athlete.getMusicContentId())) {
                            athlete.setMusicContentId(performance.getMusicContentId());
                            dirty = true;
                        }
                    }
                }
                if (dirty) {
                    athlete = athleteRepository.save(athlete);
                }

                // Final safeguard: ensure subCompetitionType is set for team members
                if (performance.getContentType() == Performance.ContentType.QUYEN) {
                    if (athlete.getSubCompetitionType() == null || athlete.getSubCompetitionType().isBlank()) {
                        String cfgId = performance.getContentId() != null && !performance.getContentId().isBlank()
                                ? performance.getContentId()
                                : performance.getFistConfigId();
                        if (cfgId != null && !cfgId.isBlank()) {
                            VovinamFistConfig cfg = vovinamFistConfigRepository.findById(cfgId).orElse(null);
                            if (cfg != null && cfg.getName() != null && !cfg.getName().isBlank()) {
                                athlete.setSubCompetitionType(cfg.getName());
                                athlete = athleteRepository.save(athlete);
                            }
                        }
                    }
                } else if (performance.getContentType() == Performance.ContentType.FIGHTING) {
                    if (athlete.getSubCompetitionType() == null || athlete.getSubCompetitionType().isBlank()) {
                        athlete.setSubCompetitionType("Hạng cân");
                        athlete = athleteRepository.save(athlete);
                    }
                } else if (performance.getContentType() == Performance.ContentType.MUSIC) {
                    if (athlete.getSubCompetitionType() == null || athlete.getSubCompetitionType().isBlank()) {
                        athlete.setSubCompetitionType("Tiết mục");
                        athlete = athleteRepository.save(athlete);
                    }
                }

                pa.setAthlete(athlete);
                performanceAthleteRepository.save(pa);
            } catch (Exception ignoredMember) {
                // Do not rollback whole approve due to one bad member
            }
        }

        performance.setStatus(Performance.PerformanceStatus.IN_PROGRESS);
        performanceRepository.save(performance);
        return convertToResponse(performance);
    }

    private PerformanceResponse convertToResponse(Performance performance) {
        // Get athletes
        List<PerformanceAthlete> performanceAthletes = performanceAthleteRepository
                .findByPerformanceId(performance.getId());
        
        List<PerformanceResponse.AthleteInfo> athletes = performanceAthletes.stream()
                .map(pa -> {
                    PerformanceResponse.AthleteInfo.AthleteInfoBuilder ab = PerformanceResponse.AthleteInfo.builder()
                            ;
                    if (pa.getAthlete() != null) {
                        ab.id(pa.getAthlete().getId().toString())
                          .fullName(pa.getAthlete().getFullName())
                          .email(pa.getAthlete().getEmail())
                          .approved(true);
                    } else {
                        ab.id(null)
                          .fullName(pa.getTempFullName())
                          .email(pa.getTempEmail())
                          .approved(false);
                    }
                    return ab.build();
                })
                .collect(Collectors.toList());

        // Get assessors
        List<Assessor> assessors = assessorRepository.findByCompetitionIdAndSpecialization(
                performance.getCompetition().getId(), 
                performance.getContentType() == Performance.ContentType.QUYEN ? 
                    Assessor.Specialization.QUYEN : 
                    performance.getContentType() == Performance.ContentType.MUSIC ? 
                        Assessor.Specialization.MUSIC : 
                        Assessor.Specialization.FIGHTING
        );
        
        List<PerformanceResponse.AssessorInfo> assessorInfos = assessors.stream()
                .map(a -> PerformanceResponse.AssessorInfo.builder()
                        .id(a.getId())
                        .fullName(a.getUser().getFullName())
                        .email(a.getUser().getPersonalMail())
                        .specialization(a.getSpecialization())
                        .build())
                .collect(Collectors.toList());

        // Get scores
        List<AssessorScore> scores = assessorScoreRepository.findByPerformanceIdOrderBySubmittedAt(performance.getId());
        
        List<PerformanceResponse.ScoreInfo> scoreInfos = scores.stream()
                .map(s -> PerformanceResponse.ScoreInfo.builder()
                        .id(s.getId())
                        .assessorId(s.getAssessor().getId())
                        .assessorName(s.getAssessor().getUser().getFullName())
                        .score(s.getScore())
                        .criteriaScores(s.getCriteriaScores())
                        .notes(s.getNotes())
                        .submittedAt(s.getSubmittedAt())
                        .build())
                .collect(Collectors.toList());

        // Calculate average score
        java.math.BigDecimal averageScore = assessorScoreRepository.calculateAverageScoreByPerformanceId(performance.getId());
        if (averageScore == null) {
            averageScore = java.math.BigDecimal.ZERO;
        }

        int assessorCount = (int) assessorScoreRepository.countByPerformanceId(performance.getId());
        int remainingAssessors = assessors.size() - assessorCount;

        return PerformanceResponse.builder()
                .id(performance.getId())
                .competitionId(performance.getCompetition().getId())
                .competitionName(performance.getCompetition().getName())
                .isTeam(performance.getIsTeam())
                .teamId(performance.getTeamId())
                .teamName(performance.getTeamName())
                .participantsPerEntry(performance.getParticipantsPerEntry())
                .performanceType(performance.getPerformanceType())
                .contentType(performance.getContentType())
                .contentId(performance.getContentId())
                .fistConfigId(performance.getFistConfigId())
                .fistItemId(performance.getFistItemId())
                .musicContentId(performance.getMusicContentId())
                .status(performance.getStatus())
                .startTime(performance.getStartTime())
                .endTime(performance.getEndTime())
                .totalScore(performance.getTotalScore())
                .athletes(athletes)
                .assessors(assessorInfos)
                .scores(scoreInfos)
                .averageScore(averageScore)
                .assessorCount(assessorCount)
                .remainingAssessors(remainingAssessors)
                .createdAt(performance.getCreatedAt())
                .updatedAt(performance.getUpdatedAt())
                .build();
    }
}

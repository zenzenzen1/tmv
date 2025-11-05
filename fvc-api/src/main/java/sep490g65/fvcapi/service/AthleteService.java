package sep490g65.fvcapi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import sep490g65.fvcapi.dto.request.CreateCompetitionOrderRequest;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.entity.CompetitionOrder;
import sep490g65.fvcapi.repository.AthleteRepository;
import sep490g65.fvcapi.repository.PerformanceAthleteRepository;
import sep490g65.fvcapi.repository.SubmittedApplicationFormRepository;
import sep490g65.fvcapi.entity.PerformanceAthlete;
import sep490g65.fvcapi.repository.WeightClassRepository;
import sep490g65.fvcapi.repository.VovinamFistItemRepository;
import sep490g65.fvcapi.repository.MusicIntegratedPerformanceRepository;
import sep490g65.fvcapi.service.CompetitionOrderService;

import java.util.UUID;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AthleteService {
    private final AthleteRepository athleteRepository;
    private final WeightClassRepository weightClassRepository;
    private final VovinamFistItemRepository fistItemRepository;
    private final CompetitionOrderService competitionOrderService;
    private final sep490g65.fvcapi.repository.VovinamFistConfigRepository fistConfigRepository;
    private final MusicIntegratedPerformanceRepository musicRepository;
    private final PerformanceAthleteRepository performanceAthleteRepository;
    private final SubmittedApplicationFormRepository submittedApplicationFormRepository;

    @Transactional
    public Athlete upsert(Athlete prototype) {
        return athleteRepository
                .findByTournamentIdAndEmail(prototype.getTournamentId(), prototype.getEmail())
                .map(existing -> {
                    existing.setFullName(prototype.getFullName());
                    existing.setGender(prototype.getGender());
                    existing.setStudentId(prototype.getStudentId());
                    existing.setClub(prototype.getClub());
                    existing.setCompetitionType(prototype.getCompetitionType());
                    existing.setSubCompetitionType(prototype.getSubCompetitionType());
                    // propagate FK IDs
                    try { existing.getClass().getDeclaredField("weightClassId"); existing.setWeightClassId(prototype.getWeightClassId()); } catch (Exception ignored) {}
                    try { existing.getClass().getDeclaredField("fistConfigId");  existing.setFistConfigId(prototype.getFistConfigId()); } catch (Exception ignored) {}
                    try { existing.getClass().getDeclaredField("fistItemId");    existing.setFistItemId(prototype.getFistItemId()); } catch (Exception ignored) {}
                    try { existing.getClass().getDeclaredField("musicContentId"); existing.setMusicContentId(prototype.getMusicContentId()); } catch (Exception ignored) {}
                    existing.setStatus(prototype.getStatus());
                    return athleteRepository.save(existing);
                })
                .orElseGet(() -> athleteRepository.save(prototype));
    }

    @Transactional
    public Athlete create(Athlete athlete) {
        return athleteRepository.save(athlete);
    }

    @Transactional
    public void deleteByEmailAndTournamentId(String email, String tournamentId) {
        athleteRepository.deleteByEmailAndTournamentId(email, tournamentId);
    }

    public Page<Athlete> list(
            String tournamentId,
            Athlete.CompetitionType competitionType,
            String subCompetitionType,
            String detailSubCompetitionType,
            String name,
            Athlete.Gender gender,
            Athlete.AthleteStatus status,
            Pageable pageable) {
        Specification<Athlete> spec = Specification.where(null);
        if (tournamentId != null && !tournamentId.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("tournamentId"), tournamentId));
        }
        if (competitionType != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("competitionType"), competitionType));
        }
        if (subCompetitionType != null && !subCompetitionType.isBlank()) {
            // For Quyền, allow matching by either stored label or by fistConfigId resolved from the label
            if (competitionType == Athlete.CompetitionType.quyen) {
                String label = subCompetitionType.trim();
                String configId = null;
                try {
                    configId = fistConfigRepository
                            .findFirstByNameStartingWithIgnoreCase(label)
                            .map(cfg -> cfg.getId())
                            .orElse(null);
                } catch (Exception ignored) {}

                final String resolvedConfigId = configId; // effectively final for lambda
                spec = spec.and((root, q, cb) -> {
                    if (resolvedConfigId != null) {
                        return cb.or(
                                cb.equal(root.get("subCompetitionType"), label),
                                cb.equal(root.get("fistConfigId"), resolvedConfigId)
                        );
                    }
                    return cb.equal(root.get("subCompetitionType"), label);
                });
            } else {
                spec = spec.and((root, q, cb) -> cb.equal(root.get("subCompetitionType"), subCompetitionType));
            }
        }
        // legacy filter removed: detailSubCompetitionType no longer used
        if (name != null && !name.isBlank()) {
            String pattern = "%" + name.trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("fullName")), pattern));
        }
        if (gender != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("gender"), gender));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        return athleteRepository.findAll(spec, pageable);
    }

    // Helper to resolve label by IDs
    public String resolveDetailLabel(Athlete a) {
        try {
            if (a.getCompetitionType() == Athlete.CompetitionType.fighting && a.getWeightClassId() != null) {
                return weightClassRepository.findById(a.getWeightClassId())
                        .map(w -> {
                            // Prefer explicit min-max formatting like "45 - 50 kg"
                            if (w.getMinWeight() != null && w.getMaxWeight() != null) {
                                String min = w.getMinWeight().stripTrailingZeros().toPlainString();
                                String max = w.getMaxWeight().stripTrailingZeros().toPlainString();
                                return min + " - " + max + " kg";
                            }
                            if (w.getWeightClass() != null && !w.getWeightClass().isBlank()) {
                                // Fallback to stored label
                                return w.getWeightClass();
                            }
                            return null;
                        })
                        .orElse(null);
            }
            if (a.getCompetitionType() == Athlete.CompetitionType.quyen) {
                // Use only configuration name for Quyền
                if (a.getFistConfigId() != null) {
                    return fistConfigRepository.findById(a.getFistConfigId()).map(cfg -> cfg.getName()).orElse(null);
                }
                // Fallback: try to infer by subCompetitionType prefix (e.g., "Song luyện" -> "Song luyện 1")
                if (a.getSubCompetitionType() != null && !a.getSubCompetitionType().isBlank()) {
                    return fistConfigRepository
                            .findFirstByNameStartingWithIgnoreCase(a.getSubCompetitionType().trim())
                            .map(cfg -> cfg.getName())
                            .orElse(null);
                }
                return null;
            }
            if (a.getCompetitionType() == Athlete.CompetitionType.music && a.getMusicContentId() != null) {
                return musicRepository.findById(a.getMusicContentId()).map(m -> m.getName()).orElse(null);
            }
        } catch (Exception ignored) {}
        return null;
    }
    
    // Resolve team info via Performance linkage and submission
    public TeamInfo resolveTeamInfo(Athlete a) {
        TeamInfo info = new TeamInfo();
        try {
            if (a == null || a.getId() == null) return info;
            java.util.List<PerformanceAthlete> links = performanceAthleteRepository.findByAthleteId(a.getId());
            if (links == null || links.isEmpty()) return info;
            // Prefer the first link (or could add logic to pick latest)
            PerformanceAthlete pa = links.get(0);
            if (pa.getPerformance() != null) {
                String perfId = pa.getPerformance().getId();
                info.setPerformanceId(perfId);
                info.setTeamName(pa.getPerformance().getTeamName());
                // Try to resolve registrant email from submitted form by performanceId
                submittedApplicationFormRepository.findOneByPerformanceId(perfId).ifPresent(s -> {
                    String mail = s.getEmail();
                    if (mail != null && !mail.isBlank()) {
                        info.setRegistrantEmail(mail);
                    } else {
                        // Fallback: try to parse email from formData JSON
                        try {
                            String formJson = s.getFormData();
                            if (formJson != null) {
                                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(formJson);
                                if (node != null && node.hasNonNull("email")) {
                                    info.setRegistrantEmail(node.get("email").asText(""));
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                });
            }
        } catch (Exception ignored) {}
        return info;
    }
    
    @lombok.Data
    public static class TeamInfo {
        private String performanceId;
        private String teamName;
        private String registrantEmail;
    }
    
    @Transactional
    public void arrangeOrder(String competitionId, String competitionType, List<sep490g65.fvcapi.dto.request.ArrangeFistOrderRequest.AthleteOrder> orders) {
        log.info("🎲 [Arrange Order] Starting arrangement for competitionId: {}, competitionType: {}, total athletes: {}", 
                competitionId, competitionType, orders.size());
        
        int successCount = 0;
        int failCount = 0;
        
        // Apply order to each athlete
        for (sep490g65.fvcapi.dto.request.ArrangeFistOrderRequest.AthleteOrder order : orders) {
            try {
                Optional<Athlete> athleteOpt = athleteRepository.findById(UUID.fromString(order.getAthleteId()));
                if (athleteOpt.isPresent()) {
                    Athlete athlete = athleteOpt.get();
                    Integer oldOrder = athlete.getCompetitionOrder();
                    athlete.setCompetitionOrder(order.getOrderIndex());
                    athleteRepository.save(athlete);
                    
                    log.debug("✅ [Arrange Order] Athlete: {} ({}), Old order: {}, New order: {}", 
                            athlete.getFullName(), order.getAthleteId(), oldOrder, order.getOrderIndex());
                    successCount++;
                } else {
                    log.warn("⚠️ [Arrange Order] Athlete not found: {}", order.getAthleteId());
                    failCount++;
                }
            } catch (Exception e) {
                log.error("❌ [Arrange Order] Failed to update athlete: {}, error: {}", 
                        order.getAthleteId(), e.getMessage(), e);
                failCount++;
            }
        }
        
        log.info("🎲 [Arrange Order] Completed - Success: {}, Failed: {}, Total: {}", 
                successCount, failCount, orders.size());
    }
}

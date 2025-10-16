package sep490g65.fvcapi.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.repository.AthleteRepository;
import sep490g65.fvcapi.repository.WeightClassRepository;
import sep490g65.fvcapi.repository.VovinamFistItemRepository;
import sep490g65.fvcapi.repository.MusicIntegratedPerformanceRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AthleteService {
    private final AthleteRepository athleteRepository;
    private final WeightClassRepository weightClassRepository;
    private final VovinamFistItemRepository fistItemRepository;
    private final sep490g65.fvcapi.repository.VovinamFistConfigRepository fistConfigRepository;
    private final MusicIntegratedPerformanceRepository musicRepository;

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

    public Page<Athlete> list(
            String tournamentId,
            Athlete.CompetitionType competitionType,
            String subCompetitionType,
            String detailSubCompetitionType,
            String name,
            Athlete.Gender gender,
            Athlete.AthleteStatus status,
            Pageable pageable
    ) {
        Specification<Athlete> spec = Specification.where(null);
        if (tournamentId != null && !tournamentId.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("tournamentId"), tournamentId));
        }
        if (competitionType != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("competitionType"), competitionType));
        }
        if (subCompetitionType != null && !subCompetitionType.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("subCompetitionType"), subCompetitionType));
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
}



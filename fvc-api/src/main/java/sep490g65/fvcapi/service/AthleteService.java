package sep490g65.fvcapi.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.repository.AthleteRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AthleteService {
    private final AthleteRepository athleteRepository;

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
                    existing.setDetailSubCompetitionType(prototype.getDetailSubCompetitionType());
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
        if (detailSubCompetitionType != null && !detailSubCompetitionType.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("detailSubCompetitionType"), detailSubCompetitionType));
        }
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
}



package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.AssignAssessorRequest;
import sep490g65.fvcapi.dto.response.AssessorResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.entity.Assessor;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.CompetitionRole;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.CompetitionRoleType;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.repository.AssessorRepository;
import sep490g65.fvcapi.repository.CompetitionRepository;
import sep490g65.fvcapi.repository.CompetitionRoleRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.AssessorService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessorServiceImpl implements AssessorService {

    private final UserRepository userRepository;
    private final AssessorRepository assessorRepository;
    private final CompetitionRepository competitionRepository;
    private final CompetitionRoleRepository competitionRoleRepository;

    @Override
    public List<UserResponse> listAvailableAssessors() {
        // Return only users with TEACHER role who can be assessors (exclude ADMIN)
        List<User> users = userRepository.findAll().stream()
                .filter(user -> user.getSystemRole() == SystemRole.TEACHER)
                .filter(user -> user.getStatus() != null && user.getStatus())
                .collect(Collectors.toList());
        return users.stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<AssessorResponse> listByCompetition(String competitionId) {
        List<Assessor> assessors = assessorRepository.findByCompetitionId(competitionId);
        return assessors.stream()
                .map(AssessorResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<AssessorResponse> listByCompetitionAndSpecialization(String competitionId, Assessor.Specialization specialization) {
        List<Assessor> assessors = assessorRepository.findByCompetitionIdAndSpecialization(competitionId, specialization);
        return assessors.stream()
                .map(AssessorResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<AssessorResponse> listByUserId(String userId) {
        List<Assessor> assessors = assessorRepository.findByUserId(userId);
        return assessors.stream()
                .map(AssessorResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AssessorResponse assignAssessor(AssignAssessorRequest request, String assignedByUserId) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUserId()));
        
        Competition competition = competitionRepository.findById(request.getCompetitionId())
                .orElseThrow(() -> new IllegalArgumentException("Competition not found: " + request.getCompetitionId()));
        
        // Check if already assigned
        if (assessorRepository.existsByUserIdAndCompetitionId(request.getUserId(), request.getCompetitionId())) {
            Assessor existing = assessorRepository.findByUserIdAndCompetitionId(request.getUserId(), request.getCompetitionId())
                    .orElse(null);
            if (existing != null) {
                log.info("Assessor already assigned, returning existing: {}", existing.getId());
                return AssessorResponse.from(existing);
            }
        }
        
        User assignedBy = assignedByUserId != null 
                ? userRepository.findById(assignedByUserId).orElse(null) 
                : null;
        
        Assessor assessor = Assessor.builder()
                .user(user)
                .competition(competition)
                .specialization(request.getSpecialization())
                .assignedBy(assignedBy)
                .build();
        
        assessor = assessorRepository.save(assessor);
        log.info("Assigned assessor {} to competition {}", user.getFullName(), competition.getName());
        
        // Create CompetitionRole for the assessor (always create)
        // Check if CompetitionRole already exists
        boolean roleExists = competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole(
                request.getCompetitionId(), user.getId(), CompetitionRoleType.ASSESSOR);
        
        if (!roleExists) {
            CompetitionRole competitionRole = CompetitionRole.builder()
                    .competition(competition)
                    .user(user)
                    .email(user.getPersonalMail() != null ? user.getPersonalMail() : user.getEduMail())
                    .role(CompetitionRoleType.ASSESSOR)
                    .assignedBy(assignedBy)
                    .build();
            
            competitionRoleRepository.save(competitionRole);
            log.info("Created CompetitionRole for assessor {} in competition {}", user.getFullName(), competition.getName());
        }
        
        return AssessorResponse.from(assessor);
    }

    @Override
    @Transactional
    public void unassignAssessor(String assessorId) {
        Assessor assessor = assessorRepository.findById(assessorId)
                .orElseThrow(() -> new IllegalArgumentException("Assessor not found: " + assessorId));
        
        // Also remove CompetitionRole if exists
        CompetitionRole competitionRole = competitionRoleRepository
                .findByCompetitionIdAndUserIdAndRole(
                        assessor.getCompetition().getId(),
                        assessor.getUser().getId(),
                        CompetitionRoleType.ASSESSOR
                ).orElse(null);
        
        if (competitionRole != null) {
            competitionRoleRepository.delete(competitionRole);
            log.info("Removed CompetitionRole for assessor {} from competition {}", 
                    assessor.getUser().getFullName(), assessor.getCompetition().getName());
        }
        
        assessorRepository.delete(assessor);
        log.info("Unassigned assessor: {}", assessorId);
    }
}


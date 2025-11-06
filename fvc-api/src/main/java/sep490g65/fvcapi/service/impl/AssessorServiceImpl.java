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
import sep490g65.fvcapi.entity.PerformanceMatch;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.CompetitionRoleType;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.repository.AssessorRepository;
import sep490g65.fvcapi.repository.PerformanceMatchRepository;
import sep490g65.fvcapi.repository.CompetitionRoleRepository;
import sep490g65.fvcapi.repository.PerformanceRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.AssessorService;
import sep490g65.fvcapi.service.PerformanceMatchService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessorServiceImpl implements AssessorService {

    private final UserRepository userRepository;
    private final AssessorRepository assessorRepository;
    private final PerformanceMatchRepository performanceMatchRepository;
    private final CompetitionRoleRepository competitionRoleRepository;
    private final PerformanceRepository performanceRepository;
    private final PerformanceMatchService performanceMatchService;

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
        // This method is deprecated - should use listByPerformance instead
        // For backward compatibility, return empty list or migrate to performance-based
        return List.of();
    }

    @Override
    public List<AssessorResponse> listByCompetitionAndSpecialization(String competitionId, Assessor.Specialization specialization) {
        // This method is deprecated - should use listByPerformanceAndSpecialization instead
        // For backward compatibility, return empty list or migrate to performance-based
        return List.of();
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
        
        User assignedBy = assignedByUserId != null 
                ? userRepository.findById(assignedByUserId).orElse(null) 
                : null;
        
        Assessor.AssessorBuilder assessorBuilder = Assessor.builder()
                .user(user)
                .specialization(request.getSpecialization())
                .assignedBy(assignedBy);
        
        // For quyền/võ nhạc: assign to performance and optionally performanceMatch
        if (request.getPerformanceId() != null || request.getPerformanceMatchId() != null) {
            sep490g65.fvcapi.entity.Performance performance = null;
            PerformanceMatch performanceMatch = null;
            
            if (request.getPerformanceId() != null) {
                performance = performanceRepository.findById(request.getPerformanceId())
                        .orElseThrow(() -> new IllegalArgumentException("Performance not found: " + request.getPerformanceId()));
                assessorBuilder.performance(performance);
            }
            
            if (request.getPerformanceMatchId() != null) {
                performanceMatch = performanceMatchRepository.findById(request.getPerformanceMatchId())
                        .orElseThrow(() -> new IllegalArgumentException("PerformanceMatch not found: " + request.getPerformanceMatchId()));
                assessorBuilder.performanceMatch(performanceMatch);
                
                // Check if already assigned to performance match
                if (assessorRepository.existsByUserIdAndPerformanceMatchId(request.getUserId(), request.getPerformanceMatchId())) {
                    Assessor existing = assessorRepository.findByUserIdAndPerformanceMatchId(request.getUserId(), request.getPerformanceMatchId())
                            .orElse(null);
                    if (existing != null) {
                        log.info("Assessor already assigned, returning existing: {}", existing.getId());
                        return AssessorResponse.from(existing);
                    }
                }
            } else if (request.getPerformanceId() != null && performanceMatch == null) {
                // Check if already assigned to performance
                if (assessorRepository.existsByUserIdAndPerformanceId(request.getUserId(), request.getPerformanceId())) {
                    Assessor existing = assessorRepository.findByUserIdAndPerformanceId(request.getUserId(), request.getPerformanceId())
                            .orElse(null);
                    if (existing != null) {
                        log.info("Assessor already assigned, returning existing: {}", existing.getId());
                        return AssessorResponse.from(existing);
                    }
                }
            }
        }
        // For đối kháng: assign to match
        else if (request.getMatchId() != null) {
            assessorBuilder.matchId(request.getMatchId())
                    .role(request.getRole())
                    .position(request.getPosition());
            
            // Check if already assigned
            if (assessorRepository.existsByUserIdAndMatchId(request.getUserId(), request.getMatchId())) {
                Assessor existing = assessorRepository.findByUserIdAndMatchId(request.getUserId(), request.getMatchId())
                        .orElse(null);
                if (existing != null) {
                    log.info("Assessor already assigned, returning existing: {}", existing.getId());
                    return AssessorResponse.from(existing);
                }
            }
        } else {
            throw new IllegalArgumentException("Either performanceId/performanceMatchId (for quyền/võ nhạc) or matchId (for đối kháng) must be provided");
        }
        
        Assessor assessor = assessorRepository.save(assessorBuilder.build());
        
        // Create CompetitionRole if performance-based (to maintain compatibility)
        if (request.getPerformanceId() != null) {
            sep490g65.fvcapi.entity.Performance performance = performanceRepository.findById(request.getPerformanceId())
                    .orElseThrow(() -> new IllegalArgumentException("Performance not found: " + request.getPerformanceId()));
            Competition competition = performance.getCompetition();
            
            // Check if CompetitionRole already exists
            boolean roleExists = competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole(
                    competition.getId(), user.getId(), CompetitionRoleType.ASSESSOR);
            
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
            
            log.info("Assigned assessor {} to performance {}", user.getFullName(), request.getPerformanceId());
        } else {
            log.info("Assigned assessor {} to match {}", user.getFullName(), request.getMatchId());
        }
        
        return AssessorResponse.from(assessor);
    }

    @Override
    @Transactional
    public void unassignAssessor(String assessorId) {
        Assessor assessor = assessorRepository.findById(assessorId)
                .orElseThrow(() -> new IllegalArgumentException("Assessor not found: " + assessorId));
        
        // Also remove CompetitionRole if exists (only for performance-based assessors)
        if (assessor.getPerformance() != null) {
            Competition competition = assessor.getPerformance().getCompetition();
            CompetitionRole competitionRole = competitionRoleRepository
                    .findByCompetitionIdAndUserIdAndRole(
                            competition.getId(),
                            assessor.getUser().getId(),
                            CompetitionRoleType.ASSESSOR
                    ).orElse(null);
            
            if (competitionRole != null) {
                competitionRoleRepository.delete(competitionRole);
                log.info("Removed CompetitionRole for assessor {} from competition {}", 
                        assessor.getUser().getFullName(), competition.getName());
            }
        }
        
        assessorRepository.delete(assessor);
        log.info("Unassigned assessor: {}", assessorId);
    }
}


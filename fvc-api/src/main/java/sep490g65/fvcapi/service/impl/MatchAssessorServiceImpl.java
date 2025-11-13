package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.AssignAssessorRequest;
import sep490g65.fvcapi.dto.request.AssignMatchAssessorsRequest;
import sep490g65.fvcapi.dto.request.AssignPerformanceAssessorsRequest;
import sep490g65.fvcapi.dto.request.CreateMatchAssessorRequest;
import sep490g65.fvcapi.dto.request.UpdateMatchAssessorRequest;
import sep490g65.fvcapi.dto.response.MatchAssessorResponse;
import sep490g65.fvcapi.dto.response.MyAssignedMatchResponse;
import sep490g65.fvcapi.dto.response.UserResponse;
import sep490g65.fvcapi.entity.Competition;
import sep490g65.fvcapi.entity.CompetitionRole;
import sep490g65.fvcapi.entity.Match;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.entity.PerformanceMatch;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.AssessorRole;
import sep490g65.fvcapi.enums.CompetitionRoleType;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.CompetitionRoleRepository;
import sep490g65.fvcapi.repository.MatchAssessorRepository;
import sep490g65.fvcapi.repository.MatchRepository;
import sep490g65.fvcapi.repository.PerformanceMatchRepository;
import sep490g65.fvcapi.repository.PerformanceRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.MatchAssessorService;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MatchAssessorServiceImpl implements MatchAssessorService {

    private final MatchAssessorRepository matchAssessorRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final PerformanceMatchRepository performanceMatchRepository;
    private final CompetitionRoleRepository competitionRoleRepository;
    private final PerformanceRepository performanceRepository;

    @Override
    @Transactional
    public List<MatchAssessorResponse> assignAssessors(AssignMatchAssessorsRequest request) {
        log.info("Assigning {} assessors to match {}", request.getAssessors().size(), request.getMatchId());

        // Validate match exists
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with ID: " + request.getMatchId()));

        // Remove existing assessors for this match FIRST, before any validation
        // This prevents duplicate errors when reassigning
        // Use deleteAllInBatch for better performance and to avoid constraint issues
        long existingCount = matchAssessorRepository.countByMatchId(request.getMatchId());
        if (existingCount > 0) {
            log.info("Removing {} existing assessors before assigning new ones", existingCount);
            // Delete directly by matchId using bulk delete query
            // @Modifying with clearAutomatically=true and flushAutomatically=true will handle cleanup
            matchAssessorRepository.deleteAllByMatchId(request.getMatchId());
            // No need for explicit flush() as flushAutomatically=true is set in @Modifying
            log.info("Successfully removed all existing assessors for match {}", request.getMatchId());
        }

        // Validate unique positions
        Set<Integer> positions = request.getAssessors().stream()
                .map(AssignMatchAssessorsRequest.AssessorAssignment::getPosition)
                .collect(Collectors.toSet());
        
        if (positions.size() != request.getAssessors().size()) {
            throw new BusinessException("Duplicate positions are not allowed", "DUPLICATE_POSITION");
        }

        // Validate positions are 1-6
        for (Integer position : positions) {
            if (position < 1 || position > 6) {
                throw new BusinessException("Position must be between 1 and 6", "INVALID_POSITION");
            }
        }

        // Validate unique users
        Set<String> userIds = request.getAssessors().stream()
                .map(AssignMatchAssessorsRequest.AssessorAssignment::getUserId)
                .collect(Collectors.toSet());
        
        if (userIds.size() != request.getAssessors().size()) {
            throw new BusinessException("Each user can only be assigned once per match", "DUPLICATE_USER");
        }

        // Create and save assessors
        List<MatchAssessor> assessors = request.getAssessors().stream()
                .map(assignment -> {
                    User user = userRepository.findById(assignment.getUserId())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + assignment.getUserId()));

                    MatchAssessor assessor = MatchAssessor.builder()
                            .match(match)
                            .user(user)
                            .position(assignment.getPosition())
                            .role(assignment.getRole())
                            .notes(assignment.getNotes())
                            .specialization(MatchAssessor.Specialization.FIGHTING) // Fighting matches always use FIGHTING specialization
                            .build();

                    return matchAssessorRepository.save(assessor);
                })
                .collect(Collectors.toList());

        log.info("Successfully assigned {} assessors to match {}", assessors.size(), request.getMatchId());

        return assessors.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<MatchAssessorResponse> assignPerformanceAssessors(AssignPerformanceAssessorsRequest request, String assignedByUserId) {
        log.info("Assigning {} assessors to performance match {}", request.getAssignments().size(), request.getPerformanceMatchId());

        PerformanceMatch performanceMatch = performanceMatchRepository.findById(request.getPerformanceMatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Performance match not found with ID: " + request.getPerformanceMatchId()));

        Performance performance = null;
        if (request.getPerformanceId() != null) {
            performance = performanceRepository.findById(request.getPerformanceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Performance not found with ID: " + request.getPerformanceId()));
        } else if (performanceMatch.getPerformance() != null) {
            performance = performanceMatch.getPerformance();
        }

        if (performance == null) {
            throw new ResourceNotFoundException("Unable to determine performance for performance match: " + request.getPerformanceMatchId());
        }

        // Remove existing assessors for this performance match + specialization to avoid duplicates
        List<MatchAssessor> existingAssessors = matchAssessorRepository
                .findByPerformanceMatchIdAndSpecialization(performanceMatch.getId(), request.getSpecialization());
        if (!existingAssessors.isEmpty()) {
            log.info("Removing {} existing assessors before assigning new ones for performance match {}", existingAssessors.size(), performanceMatch.getId());
            matchAssessorRepository.deleteAll(existingAssessors);
        }

        // Validate unique positions and users
        Set<Integer> positions = new HashSet<>();
        Set<String> userIds = new HashSet<>();
        request.getAssignments().forEach(assignment -> {
            if (assignment.getPosition() < 1 || assignment.getPosition() > 6) {
                throw new BusinessException("Position must be between 1 and 6", "INVALID_POSITION");
            }
            if (!positions.add(assignment.getPosition())) {
                throw new BusinessException("Duplicate positions are not allowed", "DUPLICATE_POSITION");
            }
            if (!userIds.add(assignment.getUserId())) {
                throw new BusinessException("Each user can only be assigned once per performance match", "DUPLICATE_USER");
            }
        });

        User assignedBy = null;
        if (assignedByUserId != null) {
            assignedBy = userRepository.findById(assignedByUserId).orElse(null);
        }

        List<MatchAssessor> savedAssessors = new ArrayList<>();
        for (AssignPerformanceAssessorsRequest.Assignment assignment : request.getAssignments()) {
            User user = userRepository.findById(assignment.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + assignment.getUserId()));

            MatchAssessor assessor = MatchAssessor.builder()
                    .performance(performance)
                    .performanceMatch(performanceMatch)
                    .user(user)
                    .assignedBy(assignedBy)
                    .specialization(request.getSpecialization())
                    .position(assignment.getPosition())
                    .role(AssessorRole.ASSESSOR)
                    .build();

            savedAssessors.add(matchAssessorRepository.save(assessor));

            Competition competition = performanceMatch.getCompetition() != null
                    ? performanceMatch.getCompetition()
                    : performance.getCompetition();

            if (competition != null && !competitionRoleRepository.existsByCompetitionIdAndUserIdAndRole(
                    competition.getId(), user.getId(), CompetitionRoleType.ASSESSOR)) {
                CompetitionRole competitionRole = CompetitionRole.builder()
                        .competition(competition)
                        .user(user)
                        .email(user.getPersonalMail() != null ? user.getPersonalMail() : user.getEduMail())
                        .role(CompetitionRoleType.ASSESSOR)
                        .assignedBy(assignedBy)
                        .build();
                competitionRoleRepository.save(competitionRole);
            }
        }

        return savedAssessors.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MatchAssessorResponse createAssessor(CreateMatchAssessorRequest request) {
        log.info("Creating assessor for match {} at position {}", request.getMatchId(), request.getPosition());

        // Validate match exists
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Match not found with ID: " + request.getMatchId()));

        // Validate user exists
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        // Check if position is already taken
        if (matchAssessorRepository.existsByMatchIdAndPosition(request.getMatchId(), request.getPosition())) {
            throw new BusinessException(
                    String.format("Position %d is already assigned in this match", request.getPosition()),
                    "POSITION_ALREADY_ASSIGNED"
            );
        }

        // Check if user is already assigned
        if (matchAssessorRepository.existsByMatchIdAndUserId(request.getMatchId(), request.getUserId())) {
            throw new BusinessException("User is already assigned to this match", "USER_ALREADY_ASSIGNED");
        }

        // Validate position and role consistency
        // Position 1-5 should be ASSESSOR, Position 6 should be JUDGER (recommendation)
        if (request.getPosition() <= 5 && request.getRole() == AssessorRole.JUDGER) {
            log.warn("Warning: Position {} assigned as JUDGER, typically positions 1-5 are ASSESSORs", request.getPosition());
        }
        if (request.getPosition() == 6 && request.getRole() == AssessorRole.ASSESSOR) {
            log.warn("Warning: Position 6 assigned as ASSESSOR, typically position 6 is JUDGER");
        }

        MatchAssessor assessor = MatchAssessor.builder()
                .match(match)
                .user(user)
                .position(request.getPosition())
                .role(request.getRole())
                .notes(request.getNotes())
                .specialization(MatchAssessor.Specialization.FIGHTING) // Fighting matches always use FIGHTING specialization
                .build();

        MatchAssessor saved = matchAssessorRepository.save(assessor);
        log.info("Successfully created assessor with ID {}", saved.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public MatchAssessorResponse updateAssessor(String assessorId, UpdateMatchAssessorRequest request) {
        log.info("Updating assessor {}", assessorId);

        MatchAssessor assessor = matchAssessorRepository.findById(assessorId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessor not found with ID: " + assessorId));

        // If updating position, check if new position is available (only for fighting matches)
        if (request.getPosition() != null && !request.getPosition().equals(assessor.getPosition())) {
            if (assessor.getMatch() != null) {
                if (matchAssessorRepository.existsByMatchIdAndPosition(assessor.getMatch().getId(), request.getPosition())) {
                    throw new BusinessException(
                            String.format("Position %d is already assigned in this match", request.getPosition()),
                            "POSITION_ALREADY_ASSIGNED"
                    );
                }
            }
            assessor.setPosition(request.getPosition());
        }

        // If updating user, check if new user is not already assigned
        if (request.getUserId() != null && !request.getUserId().equals(assessor.getUser().getId())) {
            if (assessor.getMatch() != null) {
                if (matchAssessorRepository.existsByMatchIdAndUserId(assessor.getMatch().getId(), request.getUserId())) {
                    throw new BusinessException("User is already assigned to this match", "USER_ALREADY_ASSIGNED");
                }
            }
            User newUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
            assessor.setUser(newUser);
        }

        if (request.getRole() != null) {
            assessor.setRole(request.getRole());
        }

        if (request.getNotes() != null) {
            assessor.setNotes(request.getNotes());
        }

        MatchAssessor updated = matchAssessorRepository.save(assessor);
        log.info("Successfully updated assessor {}", assessorId);

        return toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchAssessorResponse> getAssessorsByMatchId(String matchId) {
        log.debug("Fetching assessors for match {}", matchId);

        List<MatchAssessor> assessors = matchAssessorRepository.findByMatchIdOrderByPositionAsc(matchId);

        return assessors.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MatchAssessorResponse getAssessorById(String assessorId) {
        log.debug("Fetching assessor {}", assessorId);

        MatchAssessor assessor = matchAssessorRepository.findById(assessorId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessor not found with ID: " + assessorId));

        return toResponse(assessor);
    }

    @Override
    @Transactional
    public void removeAssessor(String assessorId) {
        log.info("Removing assessor {}", assessorId);

        MatchAssessor assessor = matchAssessorRepository.findById(assessorId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessor not found with ID: " + assessorId));

        matchAssessorRepository.delete(assessor);
        log.info("Successfully removed assessor {}", assessorId);
    }

    @Override
    @Transactional
    public void removeAllAssessors(String matchId) {
        log.info("Removing all assessors from match {}", matchId);

        List<MatchAssessor> assessors = matchAssessorRepository.findByMatchId(matchId);
        matchAssessorRepository.deleteAll(assessors);
        
        log.info("Successfully removed {} assessors from match {}", assessors.size(), matchId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchAssessorResponse> getAssessorsByUserId(String userId) {
        log.debug("Fetching assessors for user {}", userId);
        
        List<MatchAssessor> assessors = matchAssessorRepository.findByUserId(userId);
        
        return assessors.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyAssignedMatchResponse> getMyAssignedMatches(String userId) {
        log.debug("Fetching assigned matches for user {}", userId);

        List<MatchAssessor> assessors = matchAssessorRepository.findByUserIdWithRelations(userId);

        return assessors.stream()
                .map(this::toMyAssignedMatchResponse)
                .collect(Collectors.toList());
    }

    private MyAssignedMatchResponse toMyAssignedMatchResponse(MatchAssessor assessor) {
        MyAssignedMatchResponse.MyAssignedMatchResponseBuilder builder = MyAssignedMatchResponse.builder()
                .assessorId(assessor.getId())
                .role(assessor.getRole())
                .position(assessor.getPosition())
                .notes(assessor.getNotes())
                .createdAt(assessor.getCreatedAt())
                .updatedAt(assessor.getUpdatedAt());

        // Handle fighting match (Match entity)
        if (assessor.getMatch() != null) {
            Match match = assessor.getMatch();
            builder.matchId(match.getId())
                    .match(MyAssignedMatchResponse.MatchInfo.builder()
                            .id(match.getId())
                            .competitionId(match.getCompetitionId())
                            .redAthleteName(match.getRedAthleteName())
                            .blueAthleteName(match.getBlueAthleteName())
                            .status(match.getStatus() != null ? match.getStatus().name() : "PENDING")
                            .build());
        }

        // Handle performance match (quyền/võ nhạc)
        if (assessor.getPerformanceMatch() != null) {
            PerformanceMatch perfMatch = assessor.getPerformanceMatch();
            Performance performance = perfMatch.getPerformance();
            
            // Build participants string from performance athletes
            String participants = "";
            String contentName = "";
            if (performance != null) {
                if (performance.getAthletes() != null && !performance.getAthletes().isEmpty()) {
                    participants = performance.getAthletes().stream()
                            .filter(java.util.Objects::nonNull)
                            .map(pa -> {
                                if (pa.getAthlete() != null && pa.getAthlete().getFullName() != null) {
                                    return pa.getAthlete().getFullName();
                                }
                                return pa.getTempFullName();
                            })
                            .filter(name -> name != null && !name.isBlank())
                            .collect(Collectors.joining(", "));
                }
                
                // Set content name from performance
                if (performance.getContentType() == Performance.ContentType.QUYEN) {
                    contentName = "Quyền"; // Default, can be enhanced with fist item/config name
                } else if (performance.getContentType() == Performance.ContentType.MUSIC) {
                    contentName = "Võ nhạc"; // Default, can be enhanced with music content name
                }
            }
            
            builder.performanceMatchId(perfMatch.getId())
                    .performanceId(performance != null ? performance.getId() : null)
                    .performanceMatch(MyAssignedMatchResponse.PerformanceMatchInfo.builder()
                            .id(perfMatch.getId())
                            .competitionId(perfMatch.getCompetition() != null ? perfMatch.getCompetition().getId() : null)
                            .competitionName(perfMatch.getCompetition() != null ? perfMatch.getCompetition().getName() : null)
                            .performanceId(performance != null ? performance.getId() : null)
                            .contentName(contentName)
                            .contentType(perfMatch.getContentType() != null ? perfMatch.getContentType().name() : null)
                            .matchOrder(perfMatch.getMatchOrder())
                            .status(perfMatch.getStatus() != null ? perfMatch.getStatus().name() : "PENDING")
                            .participants(participants)
                            // Include denormalized filter fields from PerformanceMatch
                            .fistConfigId(perfMatch.getFistConfigId())
                            .fistItemId(perfMatch.getFistItemId())
                            .musicContentId(perfMatch.getMusicContentId())
                            .build());
        }

        return builder.build();
    }

    private MatchAssessorResponse toResponse(MatchAssessor assessor) {
        return MatchAssessorResponse.from(assessor);
    }

    // Methods from AssessorService
    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<MatchAssessorResponse> listByCompetition(String competitionId) {
        // This method is deprecated - should use listByPerformance instead
        // For backward compatibility, return empty list or migrate to performance-based
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchAssessorResponse> listByCompetitionAndSpecialization(String competitionId, MatchAssessor.Specialization specialization) {
        // This method is deprecated - should use listByPerformanceAndSpecialization instead
        // For backward compatibility, return empty list or migrate to performance-based
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MatchAssessorResponse> listByUserId(String userId) {
        List<MatchAssessor> assessors = matchAssessorRepository.findByUserId(userId);
        return assessors.stream()
                .map(MatchAssessorResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MatchAssessorResponse assignAssessor(AssignAssessorRequest request, String assignedByUserId) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUserId()));
        
        User assignedBy = assignedByUserId != null 
                ? userRepository.findById(assignedByUserId).orElse(null) 
                : null;
        
        MatchAssessor.MatchAssessorBuilder assessorBuilder = MatchAssessor.builder()
                .user(user)
                .assignedBy(assignedBy);
        
        // Set specialization based on request type
        // For quyền/võ nhạc: use specialization from request
        // For đối kháng: set to FIGHTING if not provided
        if (request.getMatchId() != null) {
            // For fighting matches, set specialization to FIGHTING if not already set
            assessorBuilder.specialization(
                request.getSpecialization() != null 
                    ? request.getSpecialization() 
                    : MatchAssessor.Specialization.FIGHTING
            );
        } else {
            // For quyền/võ nhạc, use specialization from request (required)
            if (request.getSpecialization() == null) {
                throw new IllegalArgumentException("Specialization is required for quyền/võ nhạc assessors");
            }
            assessorBuilder.specialization(request.getSpecialization());
        }
        
        // For quyền/võ nhạc: assign to performance and optionally performanceMatch
        if (request.getPerformanceId() != null || request.getPerformanceMatchId() != null) {
            Performance performance = null;
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
                if (request.getPosition() != null) {
                    assessorBuilder.position(request.getPosition());
                }
                
                // Check if already assigned to performance match
                if (matchAssessorRepository.existsByUserIdAndPerformanceMatchId(request.getUserId(), request.getPerformanceMatchId())) {
                    MatchAssessor existing = matchAssessorRepository.findByUserIdAndPerformanceMatchId(request.getUserId(), request.getPerformanceMatchId())
                            .orElse(null);
                    if (existing != null) {
                        log.info("Assessor already assigned, returning existing: {}", existing.getId());
                        return toResponse(existing);
                    }
                }
            } else if (request.getPerformanceId() != null && performanceMatch == null) {
                // Check if already assigned to performance
                if (matchAssessorRepository.existsByUserIdAndPerformanceId(request.getUserId(), request.getPerformanceId())) {
                    MatchAssessor existing = matchAssessorRepository.findByUserIdAndPerformanceId(request.getUserId(), request.getPerformanceId())
                            .orElse(null);
                    if (existing != null) {
                        log.info("Assessor already assigned, returning existing: {}", existing.getId());
                        return toResponse(existing);
                    }
                }
            }
        }
        // For đối kháng: assign to match
        else if (request.getMatchId() != null) {
            Match match = matchRepository.findById(request.getMatchId())
                    .orElseThrow(() -> new IllegalArgumentException("Match not found: " + request.getMatchId()));
            assessorBuilder.match(match)
                    .role(request.getRole())
                    .position(request.getPosition());
            
            // Check if already assigned
            if (matchAssessorRepository.existsByMatchIdAndUserId(request.getMatchId(), request.getUserId())) {
                MatchAssessor existing = matchAssessorRepository.findByMatchIdAndUserId(request.getMatchId(), request.getUserId())
                        .orElse(null);
                if (existing != null) {
                    log.info("Assessor already assigned, returning existing: {}", existing.getId());
                    return toResponse(existing);
                }
            }
        } else {
            throw new IllegalArgumentException("Either performanceId/performanceMatchId (for quyền/võ nhạc) or matchId (for đối kháng) must be provided");
        }
        
        MatchAssessor assessor = matchAssessorRepository.save(assessorBuilder.build());
        
        // Create CompetitionRole if performance-based (to maintain compatibility)
        if (request.getPerformanceId() != null) {
            Performance performance = performanceRepository.findById(request.getPerformanceId())
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
        
        return MatchAssessorResponse.from(assessor);
    }

    @Override
    @Transactional
    public void unassignAssessor(String assessorId) {
        MatchAssessor assessor = matchAssessorRepository.findById(assessorId)
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
        
        matchAssessorRepository.delete(assessor);
        log.info("Unassigned assessor: {}", assessorId);
    }
}


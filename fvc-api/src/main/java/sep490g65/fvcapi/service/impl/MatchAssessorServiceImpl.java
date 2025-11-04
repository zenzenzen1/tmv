package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.AssignMatchAssessorsRequest;
import sep490g65.fvcapi.dto.request.CreateMatchAssessorRequest;
import sep490g65.fvcapi.dto.request.UpdateMatchAssessorRequest;
import sep490g65.fvcapi.dto.response.MatchAssessorResponse;
import sep490g65.fvcapi.entity.Match;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.AssessorRole;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.MatchAssessorRepository;
import sep490g65.fvcapi.repository.MatchRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.MatchAssessorService;

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

    private MatchAssessorResponse toResponse(MatchAssessor assessor) {
        User user = assessor.getUser();
        return MatchAssessorResponse.builder()
                .id(assessor.getId())
                .matchId(assessor.getMatch() != null ? assessor.getMatch().getId() : null)
                .userId(user.getId())
                .userFullName(user.getFullName())
                .userEmail(user.getEduMail() != null ? user.getEduMail() : user.getPersonalMail())
                .position(assessor.getPosition())
                .role(assessor.getRole())
                .notes(assessor.getNotes())
                .createdAt(assessor.getCreatedAt())
                .updatedAt(assessor.getUpdatedAt())
                .build();
    }
}


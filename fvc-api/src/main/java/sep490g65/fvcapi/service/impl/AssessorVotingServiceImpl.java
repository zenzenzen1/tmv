package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sep490g65.fvcapi.dto.request.AssessorVoteRequest;
import sep490g65.fvcapi.dto.response.AssessorVoteResponse;
import sep490g65.fvcapi.entity.Match;
import sep490g65.fvcapi.entity.MatchAssessor;
import sep490g65.fvcapi.enums.Corner;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.MatchAssessorRepository;
import sep490g65.fvcapi.repository.MatchRepository;
import sep490g65.fvcapi.service.AssessorVotingService;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service to manage assessor votes and determine if score should be accepted (3 out of 6 rule)
 * Uses in-memory storage for active votes - votes reset when match action changes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssessorVotingServiceImpl implements AssessorVotingService {

    private final MatchRepository matchRepository;
    private final MatchAssessorRepository matchAssessorRepository;
    
    // In-memory storage: matchId -> (assessorId -> vote)
    // Vote is a map: {corner: RED/BLUE, score: 1/2}
    private final Map<String, Map<String, Map<String, Object>>> activeVotes = new ConcurrentHashMap<>();
    
    // Track last action timestamp per match to auto-reset votes
    private final Map<String, Long> lastActionTime = new ConcurrentHashMap<>();

    @Override
    public AssessorVoteResponse processVote(AssessorVoteRequest request) {
        log.info("Processing vote: matchId={}, assessorId={}, corner={}, score={}", 
                request.getMatchId(), request.getAssessorId(), request.getCorner(), request.getScore());

        // Validate match exists and is active
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Match not found: " + request.getMatchId()));

        // Validate assessor exists and is assigned to this match
        // request.getAssessorId() is the MatchAssessor ID (not userId)
        MatchAssessor assessor = matchAssessorRepository.findById(request.getAssessorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assessor not found or not assigned to this match"));
        
        // Verify the assessor belongs to this match
        if (!assessor.getMatch().getId().equals(request.getMatchId())) {
            throw new BusinessException(
                    "Assessor does not belong to this match",
                    "ASSESSOR_MATCH_MISMATCH");
        }

        // Get all assessors for this match
        List<MatchAssessor> matchAssessors = matchAssessorRepository.findByMatchIdOrderByPositionAsc(
                request.getMatchId());

        // Initialize vote storage for this match if not exists
        activeVotes.putIfAbsent(request.getMatchId(), new ConcurrentHashMap<>());

        // Store the vote
        Map<String, Object> vote = new HashMap<>();
        vote.put("corner", request.getCorner().name());
        vote.put("score", request.getScore());
        vote.put("assessorId", request.getAssessorId());
        vote.put("assessorPosition", assessor.getPosition());
        
        activeVotes.get(request.getMatchId()).put(request.getAssessorId(), vote);
        lastActionTime.put(request.getMatchId(), System.currentTimeMillis());

        // Check voting consensus
        return checkVotingConsensus(request.getMatchId(), request.getCorner(), request.getScore());
    }

    @Override
    public AssessorVoteResponse getVotingStatus(String matchId) {
        if (!activeVotes.containsKey(matchId)) {
            return buildEmptyResponse(matchId);
        }

        Map<String, Map<String, Object>> votes = activeVotes.get(matchId);
        
        // Group votes by corner and score
        Map<String, Long> voteGroups = votes.values().stream()
                .collect(Collectors.groupingBy(
                        v -> v.get("corner") + "_" + v.get("score"),
                        Collectors.counting()
                ));

        // Find the most voted combination
        if (voteGroups.isEmpty()) {
            return buildEmptyResponse(matchId);
        }

        String maxVoteKey = voteGroups.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        if (maxVoteKey == null) {
            return buildEmptyResponse(matchId);
        }

        String[] parts = maxVoteKey.split("_");
        Corner corner = Corner.valueOf(parts[0]);
        Integer score = Integer.parseInt(parts[1]);
        Long voteCount = voteGroups.get(maxVoteKey);

        return checkVotingConsensus(matchId, corner, score);
    }

    private AssessorVoteResponse checkVotingConsensus(String matchId, Corner corner, Integer score) {
        List<MatchAssessor> matchAssessors = matchAssessorRepository.findByMatchIdOrderByPositionAsc(matchId);
        int totalAssessors = matchAssessors.size();

        Map<String, Map<String, Object>> votes = activeVotes.getOrDefault(matchId, new HashMap<>());

        // Count votes matching this corner and score
        long matchingVotes = votes.values().stream()
                .filter(v -> v.get("corner").equals(corner.name()) && 
                           v.get("score").equals(score))
                .count();

        // Check if >= 3 out of 6 (or majority if less than 6)
        boolean scoreAccepted = matchingVotes >= 3;

        // Build votes map for response
        Map<String, Integer> votesMap = votes.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> {
                            Map<String, Object> vote = e.getValue();
                            if (vote.get("corner").equals(corner.name()) && 
                                vote.get("score").equals(score)) {
                                return (Integer) vote.get("score");
                            }
                            return null;
                        }
                ));
        
        // Remove null values
        votesMap = votesMap.entrySet().stream()
                .filter(e -> e.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        log.info("Voting consensus check: matchId={}, corner={}, score={}, votes={}/{}, accepted={}", 
                matchId, corner, score, matchingVotes, totalAssessors, scoreAccepted);

        return AssessorVoteResponse.builder()
                .matchId(matchId)
                .corner(corner)
                .score(score)
                .voteCount((int) matchingVotes)
                .totalAssessors(totalAssessors)
                .scoreAccepted(scoreAccepted)
                .votes(votesMap)
                .build();
    }

    private AssessorVoteResponse buildEmptyResponse(String matchId) {
        List<MatchAssessor> matchAssessors = matchAssessorRepository.findByMatchIdOrderByPositionAsc(matchId);
        return AssessorVoteResponse.builder()
                .matchId(matchId)
                .voteCount(0)
                .totalAssessors(matchAssessors.size())
                .scoreAccepted(false)
                .votes(new HashMap<>())
                .build();
    }

    @Override
    public void resetVotes(String matchId) {
        log.info("Resetting votes for match {}", matchId);
        activeVotes.remove(matchId);
        lastActionTime.remove(matchId);
    }
}


package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.AssessorVoteRequest;
import sep490g65.fvcapi.dto.response.AssessorVoteResponse;

public interface AssessorVotingService {
    
    /**
     * Process a vote from an assessor
     * Returns vote response with updated counts
     */
    AssessorVoteResponse processVote(AssessorVoteRequest request);
    
    /**
     * Get current voting status for a match
     */
    AssessorVoteResponse getVotingStatus(String matchId);
    
    /**
     * Reset votes for a match (when starting new round or action)
     */
    void resetVotes(String matchId);
}


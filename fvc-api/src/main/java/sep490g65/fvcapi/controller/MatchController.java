package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.ControlMatchRequest;
import sep490g65.fvcapi.dto.request.CreateMatchRequest;
import sep490g65.fvcapi.dto.request.RecordScoreEventRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.MatchEventDto;
import sep490g65.fvcapi.dto.response.MatchListItemDto;
import sep490g65.fvcapi.dto.response.MatchRoundDto;
import sep490g65.fvcapi.dto.response.MatchScoreboardDto;
import sep490g65.fvcapi.service.MatchService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/matches")
@RequiredArgsConstructor
@Slf4j
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/list")
    public ResponseEntity<BaseResponse<List<MatchListItemDto>>> listMatches(
            @RequestParam(required = false) String competitionId,
            @RequestParam(required = false) String status) {
        try {
            List<MatchListItemDto> matches = matchService.listMatches(competitionId, status);
            return ResponseEntity.ok(ResponseUtils.success("Matches retrieved successfully", matches));
        } catch (Exception e) {
            log.error("Error listing matches", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_LIST_ERROR"));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<BaseResponse<MatchScoreboardDto>> createMatch(
            @Valid @RequestBody CreateMatchRequest request,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            MatchScoreboardDto scoreboard = matchService.createMatch(request, userId);
            return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                    .body(ResponseUtils.success("Match created successfully", scoreboard));
        } catch (Exception e) {
            log.error("Error creating match", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_CREATE_ERROR"));
        }
    }

    @GetMapping("/{matchId}/scoreboard")
    public ResponseEntity<BaseResponse<MatchScoreboardDto>> getScoreboard(@PathVariable String matchId) {
        try {
            MatchScoreboardDto scoreboard = matchService.getScoreboard(matchId);
            return ResponseEntity.ok(ResponseUtils.success(
                    MessageConstants.MATCH_SCOREBOARD_RETRIEVED, scoreboard));
        } catch (Exception e) {
            log.error("Error fetching scoreboard for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to fetch scoreboard", "MATCH_FETCH_ERROR"));
        }
    }

    @GetMapping("/{matchId}/events")
    public ResponseEntity<BaseResponse<List<MatchEventDto>>> getEventHistory(@PathVariable String matchId) {
        try {
            List<MatchEventDto> events = matchService.getEventHistory(matchId);
            return ResponseEntity.ok(ResponseUtils.success(
                    MessageConstants.MATCH_EVENTS_RETRIEVED, events));
        } catch (Exception e) {
            log.error("Error fetching events for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    "Failed to fetch events", "MATCH_EVENTS_FETCH_ERROR"));
        }
    }

    @PostMapping("/score")
    public ResponseEntity<BaseResponse<Void>> recordScoreEvent(@Valid @RequestBody RecordScoreEventRequest request) {
        try {
            matchService.recordScoreEvent(request);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.SCORE_EVENT_RECORDED));
        } catch (Exception e) {
            log.error("Error recording score event", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_EVENT_RECORD_ERROR"));
        }
    }

    @PostMapping("/control")
    public ResponseEntity<BaseResponse<Void>> controlMatch(@Valid @RequestBody ControlMatchRequest request) {
        try {
            matchService.controlMatch(request);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.MATCH_CONTROL_SUCCESS));
        } catch (Exception e) {
            log.error("Error controlling match", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_CONTROL_ERROR"));
        }
    }

    @PostMapping("/{matchId}/undo")
    public ResponseEntity<BaseResponse<Void>> undoLastEvent(@PathVariable String matchId) {
        try {
            matchService.undoLastEvent(matchId);
            return ResponseEntity.ok(ResponseUtils.success(MessageConstants.MATCH_EVENT_UNDONE));
        } catch (Exception e) {
            log.error("Error undoing last event for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_UNDO_ERROR"));
        }
    }

    @PatchMapping("/{matchId}/round-duration")
    public ResponseEntity<BaseResponse<Void>> updateRoundDuration(
            @PathVariable String matchId,
            @RequestParam Integer roundDurationSeconds) {
        try {
            matchService.updateRoundDuration(matchId, roundDurationSeconds);
            return ResponseEntity.ok(ResponseUtils.success("Round duration updated successfully"));
        } catch (Exception e) {
            log.error("Error updating round duration for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_UPDATE_DURATION_ERROR"));
        }
    }

    @PatchMapping("/{matchId}/main-round-duration")
    public ResponseEntity<BaseResponse<Void>> updateMainRoundDuration(
            @PathVariable String matchId,
            @RequestParam Integer mainRoundDurationSeconds) {
        try {
            matchService.updateMainRoundDuration(matchId, mainRoundDurationSeconds);
            return ResponseEntity.ok(ResponseUtils.success("Main round duration updated successfully"));
        } catch (Exception e) {
            log.error("Error updating main round duration for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_UPDATE_MAIN_ROUND_DURATION_ERROR"));
        }
    }

    @PatchMapping("/{matchId}/tiebreaker-duration")
    public ResponseEntity<BaseResponse<Void>> updateTiebreakerDuration(
            @PathVariable String matchId,
            @RequestParam Integer tiebreakerDurationSeconds) {
        try {
            matchService.updateTiebreakerDuration(matchId, tiebreakerDurationSeconds);
            return ResponseEntity.ok(ResponseUtils.success("Tiebreaker duration updated successfully"));
        } catch (Exception e) {
            log.error("Error updating tiebreaker duration for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_UPDATE_TIEBREAKER_DURATION_ERROR"));
        }
    }

    @PatchMapping("/{matchId}/field")
    public ResponseEntity<BaseResponse<Void>> updateField(
            @PathVariable String matchId,
            @RequestParam(required = false) String fieldId) {
        try {
            matchService.updateField(matchId, fieldId);
            return ResponseEntity.ok(ResponseUtils.success("Field updated successfully"));
        } catch (Exception e) {
            log.error("Error updating field for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_UPDATE_FIELD_ERROR"));
        }
    }

    @PatchMapping("/{matchId}/total-rounds")
    public ResponseEntity<BaseResponse<Void>> updateTotalRounds(
            @PathVariable String matchId,
            @RequestParam Integer totalRounds) {
        try {
            matchService.updateTotalRounds(matchId, totalRounds);
            return ResponseEntity.ok(ResponseUtils.success("Total rounds updated successfully"));
        } catch (Exception e) {
            log.error("Error updating total rounds for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_UPDATE_TOTAL_ROUNDS_ERROR"));
        }
    }

    @GetMapping("/{matchId}/rounds")
    public ResponseEntity<BaseResponse<List<MatchRoundDto>>> getRoundHistory(@PathVariable String matchId) {
        try {
            List<MatchRoundDto> rounds = matchService.getRoundHistory(matchId);
            return ResponseEntity.ok(ResponseUtils.success("Round history retrieved successfully", rounds));
        } catch (Exception e) {
            log.error("Error fetching round history for match {}", matchId, e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage(), "MATCH_ROUND_HISTORY_ERROR"));
        }
    }
}


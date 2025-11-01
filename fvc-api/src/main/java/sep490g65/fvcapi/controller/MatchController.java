package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.ControlMatchRequest;
import sep490g65.fvcapi.dto.request.RecordScoreEventRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.MatchEventDto;
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
}


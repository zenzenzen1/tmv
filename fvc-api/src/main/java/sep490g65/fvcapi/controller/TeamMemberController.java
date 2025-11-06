package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.teammember.TeamMemberAddRequest;
import sep490g65.fvcapi.dto.teammember.TeamMemberBulkAddRequest;
import sep490g65.fvcapi.dto.teammember.TeamMemberDto;
import sep490g65.fvcapi.dto.teammember.TeamMemberRemoveRequest;
import sep490g65.fvcapi.service.TeamMemberService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH)
@Validated
@RequiredArgsConstructor
public class TeamMemberController {

    private final TeamMemberService teamMemberService;

    @GetMapping(ApiConstants.TEAMS_PATH + "/{teamId}" + ApiConstants.TEAM_MEMBERS_SUBPATH)
    public ResponseEntity<BaseResponse<PaginationResponse<TeamMemberDto>>> listByTeam(
            @PathVariable String teamId,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            Pageable pageable
    ) {
        Page<TeamMemberDto> page = teamMemberService.listByTeam(teamId, activeOnly, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Team members retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping("/users/{userId}" + ApiConstants.TEAM_MEMBERS_SUBPATH)
    public ResponseEntity<BaseResponse<PaginationResponse<TeamMemberDto>>> historyByUser(
            @PathVariable String userId,
            Pageable pageable
    ) {
        Page<TeamMemberDto> page = teamMemberService.listHistoryByUser(userId, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Team membership history retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @PostMapping(ApiConstants.TEAMS_PATH + "/{teamId}" + ApiConstants.TEAM_MEMBERS_SUBPATH)
    public ResponseEntity<BaseResponse<TeamMemberDto>> add(
            @PathVariable String teamId,
            @RequestBody @Validated TeamMemberAddRequest request
    ) {
        return ResponseEntity.ok(ResponseUtils.success("Member added",
                teamMemberService.addMember(teamId, request)));
    }

    @DeleteMapping(ApiConstants.TEAMS_PATH + "/{teamId}" + ApiConstants.TEAM_MEMBERS_SUBPATH + "/{userId}")
    public ResponseEntity<BaseResponse<TeamMemberDto>> remove(
            @PathVariable String teamId,
            @PathVariable String userId,
            @RequestBody(required = false) TeamMemberRemoveRequest request
    ) {
        return ResponseEntity.ok(ResponseUtils.success("Member removed",
                teamMemberService.removeMember(teamId, userId, request == null ? new TeamMemberRemoveRequest() : request)));
    }

    @PostMapping(ApiConstants.TEAMS_PATH + "/{teamId}" + ApiConstants.TEAM_MEMBERS_SUBPATH + "/bulk")
    public ResponseEntity<BaseResponse<PaginationResponse<TeamMemberDto>>> bulkAdd(
            @PathVariable String teamId,
            @RequestBody @Validated TeamMemberBulkAddRequest request,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ResponseUtils.success("Bulk add completed",
                teamMemberService.bulkAddMembers(teamId, request, pageable)));
    }

    @PostMapping(ApiConstants.TEAMS_PATH + "/{teamId}" + ApiConstants.TEAM_MEMBERS_SUBPATH + "/{userId}/readd")
    public ResponseEntity<BaseResponse<TeamMemberDto>> reAdd(
            @PathVariable String teamId,
            @PathVariable String userId
    ) {
        return ResponseEntity.ok(ResponseUtils.success("Member re-added",
                teamMemberService.reAddMember(teamId, userId)));
    }
}



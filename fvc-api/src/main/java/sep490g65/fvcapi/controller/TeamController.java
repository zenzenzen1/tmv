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
import sep490g65.fvcapi.dto.team.TeamCreateRequest;
import sep490g65.fvcapi.dto.team.TeamDto;
import sep490g65.fvcapi.dto.team.TeamUpdateRequest;
import sep490g65.fvcapi.service.TeamService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH)
@Validated
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping(ApiConstants.CYCLES_PATH + "/{cycleId}" + ApiConstants.TEAMS_PATH)
    public ResponseEntity<BaseResponse<PaginationResponse<TeamDto>>> listByCycle(
            @PathVariable String cycleId,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<TeamDto> page = teamService.listByCycle(cycleId, search, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Teams retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping(ApiConstants.TEAMS_PATH + "/{id}")
    public ResponseEntity<BaseResponse<TeamDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Team retrieved", teamService.getById(id)));
    }

    @PostMapping(ApiConstants.CYCLES_PATH + "/{cycleId}" + ApiConstants.TEAMS_PATH)
    public ResponseEntity<BaseResponse<TeamDto>> create(
            @PathVariable String cycleId,
            @RequestBody @Validated TeamCreateRequest request) {
        return ResponseEntity.ok(ResponseUtils.success("Team created", teamService.create(cycleId, request)));
    }

    @PutMapping(ApiConstants.TEAMS_PATH + "/{id}")
    public ResponseEntity<BaseResponse<TeamDto>> update(
            @PathVariable String id,
            @RequestBody @Validated TeamUpdateRequest request) {
        return ResponseEntity.ok(ResponseUtils.success("Team updated", teamService.update(id, request)));
    }

    @DeleteMapping(ApiConstants.TEAMS_PATH + "/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable String id) {
        teamService.delete(id);
        return ResponseEntity.ok(ResponseUtils.success("Team deleted"));
    }
}



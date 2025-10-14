package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.service.AthleteService;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.UUID;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/athletes")
@RequiredArgsConstructor
public class AthleteController {
    private final AthleteService athleteService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<Athlete>>> list(@RequestParam(defaultValue = "0") int page,
                                                                          @RequestParam(defaultValue = "5") int size,
                                                                          @RequestParam(required = false) String tournamentId,
                                                                          @RequestParam(required = false) Athlete.CompetitionType competitionType,
                                                                          @RequestParam(required = false) String name,
                                                                          @RequestParam(required = false) Athlete.Gender gender,
                                                                          @RequestParam(required = false) Athlete.AthleteStatus status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Athlete> result = athleteService.list(tournamentId, competitionType, name, gender, status, pageable);
        PaginationResponse<Athlete> payload = ResponseUtils.createPaginatedResponse(result);
        return ResponseEntity.ok(ResponseUtils.success("Athletes retrieved", payload));
    }
}



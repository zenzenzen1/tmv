package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.DrawRequest;
import sep490g65.fvcapi.dto.DrawResponse;
import sep490g65.fvcapi.service.DrawService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/draws")
@RequiredArgsConstructor
public class DrawController {

    private final DrawService drawService;

    @PostMapping("/perform")
    public ResponseEntity<DrawResponse> performDraw(@RequestBody DrawRequest request, Authentication authentication) {
        String userId = authentication.getName();
        DrawResponse response = drawService.performDraw(request, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{competitionId}/{weightClassId}")
    public ResponseEntity<List<DrawResponse>> getDrawHistory(
            @PathVariable String competitionId,
            @PathVariable String weightClassId) {
        List<DrawResponse> history = drawService.getDrawHistory(competitionId, weightClassId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/final/{competitionId}/{weightClassId}")
    public ResponseEntity<DrawResponse> getFinalDraw(
            @PathVariable String competitionId,
            @PathVariable String weightClassId) {
        Optional<DrawResponse> finalDraw = drawService.getFinalDraw(competitionId, weightClassId);
        return finalDraw.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/finalize/{drawSessionId}")
    public ResponseEntity<Void> finalizeDraw(@PathVariable String drawSessionId, Authentication authentication) {
        String userId = authentication.getName();
        drawService.finalizeDraw(drawSessionId, userId);
        return ResponseEntity.ok().build();
    }
}

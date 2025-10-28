package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.dto.request.CreatePerformanceRequest;
import sep490g65.fvcapi.dto.response.PerformanceResponse;
import sep490g65.fvcapi.entity.Performance;
import sep490g65.fvcapi.service.PerformanceService;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/performances")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    @PostMapping
    public ResponseEntity<PerformanceResponse> createPerformance(@Valid @RequestBody CreatePerformanceRequest request) {
        PerformanceResponse response = performanceService.createPerformance(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PerformanceResponse> getPerformanceById(@PathVariable String id) {
        PerformanceResponse response = performanceService.getPerformanceById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<List<PerformanceResponse>> getPerformancesByCompetitionId(@PathVariable String competitionId) {
        List<PerformanceResponse> responses = performanceService.getPerformancesByCompetitionId(competitionId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/competition/{competitionId}/type/{performanceType}")
    public ResponseEntity<List<PerformanceResponse>> getPerformancesByType(
            @PathVariable String competitionId, 
            @PathVariable Performance.PerformanceType performanceType) {
        List<PerformanceResponse> responses = performanceService.getPerformancesByCompetitionIdAndType(competitionId, performanceType);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/competition/{competitionId}/content/{contentType}")
    public ResponseEntity<List<PerformanceResponse>> getPerformancesByContentType(
            @PathVariable String competitionId, 
            @PathVariable Performance.ContentType contentType) {
        List<PerformanceResponse> responses = performanceService.getPerformancesByCompetitionIdAndContentType(competitionId, contentType);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<PerformanceResponse> updatePerformanceStatus(
            @PathVariable String id, 
            @PathVariable Performance.PerformanceStatus status) {
        PerformanceResponse response = performanceService.updatePerformanceStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<PerformanceResponse> startPerformance(@PathVariable String id) {
        PerformanceResponse response = performanceService.startPerformance(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<PerformanceResponse> completePerformance(@PathVariable String id) {
        PerformanceResponse response = performanceService.completePerformance(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<PerformanceResponse> cancelPerformance(@PathVariable String id) {
        PerformanceResponse response = performanceService.cancelPerformance(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePerformance(@PathVariable String id) {
        performanceService.deletePerformance(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{performanceId}/athletes/{athleteId}")
    public ResponseEntity<PerformanceResponse> addAthleteToPerformance(
            @PathVariable String performanceId,
            @PathVariable String athleteId,
            @RequestParam Integer teamPosition,
            @RequestParam(defaultValue = "false") Boolean isCaptain) {
        PerformanceResponse response = performanceService.addAthleteToPerformance(performanceId, athleteId, teamPosition, isCaptain);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{performanceId}/athletes/{athleteId}")
    public ResponseEntity<Void> removeAthleteFromPerformance(
            @PathVariable String performanceId,
            @PathVariable String athleteId) {
        performanceService.removeAthleteFromPerformance(performanceId, athleteId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<PerformanceResponse> approve(@PathVariable String id) {
        return ResponseEntity.ok(performanceService.approve(id));
    }
}

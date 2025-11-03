package sep490g65.fvcapi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.DrawRequest;
import sep490g65.fvcapi.dto.DrawResponse;
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.entity.DrawResult;
import sep490g65.fvcapi.entity.DrawSession;
import sep490g65.fvcapi.enums.DrawType;
import sep490g65.fvcapi.repository.AthleteRepository;
import sep490g65.fvcapi.repository.DrawResultRepository;
import sep490g65.fvcapi.repository.DrawSessionRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DrawService {

    private final DrawSessionRepository drawSessionRepository;
    private final DrawResultRepository drawResultRepository;
    private final AthleteRepository athleteRepository;

    @Transactional
    public DrawResponse performDraw(DrawRequest request, String userId) {
        log.info("Performing draw for competition: {}, weightClass: {}, type: {}", 
                request.getCompetitionId(), request.getWeightClassId(), request.getDrawType());

        // Create draw session
        DrawSession drawSession = new DrawSession();
        drawSession.setCompetitionId(request.getCompetitionId());
        drawSession.setWeightClassId(request.getWeightClassId());
        drawSession.setDrawType(request.getDrawType());
        drawSession.setDrawnBy(userId);
        drawSession.setDrawDate(LocalDateTime.now());
        drawSession.setIsFinal(false);
        drawSession.setNotes(request.getNotes());
        drawSession.setCreatedBy(userId);
        drawSession.setCreatedAt(LocalDateTime.now());

        drawSession = drawSessionRepository.save(drawSession);

        // Process draw results based on type
        List<DrawResult> drawResults;
        if (request.getDrawType() == DrawType.ONLINE_AUTOMATIC) {
            drawResults = performAutomaticDraw(drawSession.getId(), request);
        } else {
            drawResults = performManualDraw(drawSession.getId(), request);
        }

        // Save draw results
        drawResults = drawResultRepository.saveAll(drawResults);

        // Update athlete competition orders
        updateAthleteCompetitionOrders(drawResults);

        return buildDrawResponse(drawSession, drawResults);
    }

    private List<DrawResult> performAutomaticDraw(String drawSessionId, DrawRequest request) {
        log.info("🎲 [Draw] Performing automatic draw for session: {}, competitionId: {}, weightClassId: {}", 
                drawSessionId, request.getCompetitionId(), request.getWeightClassId());

        // Try to find athletes by competition relationship first
        List<Athlete> athletes = athleteRepository.findByCompetitionIdAndCompetitionTypeAndWeightClassId(
                request.getCompetitionId(),
                Athlete.CompetitionType.fighting,
                request.getWeightClassId()
        );
        
        log.info("🎲 [Draw] Found {} athletes by competition relationship", athletes.size());
        
        // If not found, try by tournament ID
        if (athletes.isEmpty()) {
            log.info("🎲 [Draw] No athletes found by competition. Trying by tournamentId: {}", request.getCompetitionId());
            athletes = athleteRepository.findByTournamentIdAndCompetitionTypeAndWeightClassId(
                    request.getCompetitionId(),
                    Athlete.CompetitionType.fighting,
                    request.getWeightClassId()
            );
            log.info("🎲 [Draw] Found {} athletes by tournamentId", athletes.size());
        }
        
        if (athletes.isEmpty()) {
            // Log all athletes for debugging
            List<Athlete> allAthletes = athleteRepository.findAll();
            log.warn("⚠️ [Draw] No athletes found. Total athletes in database: {}", allAthletes.size());
            
            // Log sample athlete data
            if (!allAthletes.isEmpty()) {
                Athlete sample = allAthletes.get(0);
                log.info("📋 [Draw] Sample athlete data - ID: {}, Competition ID: {}, Competition Type: {}, Weight Class: {}, Tournament ID: {}", 
                        sample.getId(), 
                        sample.getCompetition() != null ? sample.getCompetition().getId() : "NULL",
                        sample.getCompetitionType(),
                        sample.getWeightClassId(),
                        sample.getTournamentId());
            }
            
            throw new IllegalArgumentException("No athletes found for the specified competition and weight class");
        }

        // Create seed numbers (1 to N)
        List<Integer> seedNumbers = new ArrayList<>();
        for (int i = 1; i <= athletes.size(); i++) {
            seedNumbers.add(i);
        }

        // Shuffle the seed numbers randomly
        Collections.shuffle(seedNumbers);

        // Create draw results
        List<DrawResult> drawResults = new ArrayList<>();
        for (int i = 0; i < athletes.size(); i++) {
            Athlete athlete = athletes.get(i);
            Integer seedNumber = seedNumbers.get(i);

            DrawResult drawResult = new DrawResult();
            drawResult.setDrawSessionId(drawSessionId);
            drawResult.setAthleteId(athlete.getId().toString());
            drawResult.setSeedNumber(seedNumber);
            drawResult.setAthleteName(athlete.getFullName());
            drawResult.setAthleteClub(athlete.getClub());

            drawResults.add(drawResult);
        }

        return drawResults;
    }

    private List<DrawResult> performManualDraw(String drawSessionId, DrawRequest request) {
        log.info("Performing manual draw for session: {}", drawSessionId);

        List<DrawResult> drawResults = new ArrayList<>();

        for (DrawRequest.AthleteSeed athleteSeed : request.getAthleteSeeds()) {
            DrawResult drawResult = new DrawResult();
            drawResult.setDrawSessionId(drawSessionId);
            drawResult.setAthleteId(athleteSeed.getAthleteId());
            drawResult.setSeedNumber(athleteSeed.getSeedNumber());
            drawResult.setAthleteName(athleteSeed.getAthleteName());
            drawResult.setAthleteClub(athleteSeed.getAthleteClub());

            drawResults.add(drawResult);
        }

        return drawResults;
    }

    private void updateAthleteCompetitionOrders(List<DrawResult> drawResults) {
        log.info("🎲 [Draw Service] Updating athlete competition orders for {} results", drawResults.size());

        int successCount = 0;
        int failCount = 0;

        for (DrawResult result : drawResults) {
            try {
                Optional<Athlete> athleteOpt = athleteRepository.findById(UUID.fromString(result.getAthleteId()));
                if (athleteOpt.isPresent()) {
                    Athlete athlete = athleteOpt.get();
                    Integer oldOrder = athlete.getCompetitionOrder();
                    athlete.setCompetitionOrder(result.getSeedNumber());
                    athleteRepository.save(athlete);
                    
                    log.debug("✅ [Draw Service] Updated athlete: {} (ID: {}), Old order: {}, New order (seed): {}", 
                            athlete.getFullName(), result.getAthleteId(), oldOrder, result.getSeedNumber());
                    successCount++;
                } else {
                    log.warn("⚠️ [Draw Service] Athlete not found for ID: {}", result.getAthleteId());
                    failCount++;
                }
            } catch (Exception e) {
                log.error("❌ [Draw Service] Failed to update athlete: {}, error: {}", 
                        result.getAthleteId(), e.getMessage(), e);
                failCount++;
            }
        }
        
        log.info("🎲 [Draw Service] Completed updating orders - Success: {}, Failed: {}, Total: {}", 
                successCount, failCount, drawResults.size());
    }

    private DrawResponse buildDrawResponse(DrawSession drawSession, List<DrawResult> drawResults) {
        List<DrawResponse.DrawResult> responseResults = drawResults.stream()
                .map(result -> new DrawResponse.DrawResult(
                        result.getAthleteId(),
                        result.getAthleteName(),
                        result.getAthleteClub(),
                        result.getSeedNumber()
                ))
                .collect(Collectors.toList());

        return new DrawResponse(
                drawSession.getId(),
                drawSession.getCompetitionId(),
                drawSession.getWeightClassId(),
                drawSession.getDrawType(),
                drawSession.getDrawnBy(),
                drawSession.getDrawDate(),
                drawSession.getIsFinal(),
                drawSession.getNotes(),
                responseResults
        );
    }

    public List<DrawResponse> getDrawHistory(String competitionId, String weightClassId) {
        List<DrawSession> sessions = drawSessionRepository.findByCompetitionAndWeightClass(competitionId, weightClassId);
        
        return sessions.stream()
                .map(session -> {
                    List<DrawResult> results = drawResultRepository.findByDrawSessionIdOrderBySeedNumber(session.getId());
                    return buildDrawResponse(session, results);
                })
                .collect(Collectors.toList());
    }

    public Optional<DrawResponse> getFinalDraw(String competitionId, String weightClassId) {
        Optional<DrawSession> finalSession = drawSessionRepository.findFinalDrawSession(competitionId, weightClassId);
        
        if (finalSession.isPresent()) {
            List<DrawResult> results = drawResultRepository.findByDrawSessionIdOrderBySeedNumber(finalSession.get().getId());
            return Optional.of(buildDrawResponse(finalSession.get(), results));
        }
        
        return Optional.empty();
    }

    @Transactional
    public void finalizeDraw(String drawSessionId, String userId) {
        Optional<DrawSession> sessionOpt = drawSessionRepository.findById(drawSessionId);
        if (sessionOpt.isPresent()) {
            DrawSession session = sessionOpt.get();
            session.setIsFinal(true);
            drawSessionRepository.save(session);
            log.info("Draw session {} finalized by user {}", drawSessionId, userId);
        }
    }
}

package sep490g65.fvcapi.dto.training;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.dto.cycle.ChallengeCycleDto;
import sep490g65.fvcapi.dto.location.LocationDto;
import sep490g65.fvcapi.dto.phase.ChallengePhaseDto;
import sep490g65.fvcapi.dto.team.TeamDto;
import sep490g65.fvcapi.dto.user.UserDto;
import sep490g65.fvcapi.enums.TrainingSessionStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingSessionDto {
    private String id;
    private String title;
    private String description;
    private ChallengeCycleDto cycle;
    private TeamDto team;
    private ChallengePhaseDto phase;
    private LocationDto location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer capacity;
    private TrainingSessionStatus status;
    private UserDto createdBy;
    private UserDto updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}



package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.teammember.TeamMemberAddRequest;
import sep490g65.fvcapi.dto.teammember.TeamMemberBulkAddRequest;
import sep490g65.fvcapi.dto.teammember.TeamMemberDto;
import sep490g65.fvcapi.dto.teammember.TeamMemberRemoveRequest;
import sep490g65.fvcapi.entity.Team;
import sep490g65.fvcapi.entity.TeamMember;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.TeamMemberRepository;
import sep490g65.fvcapi.repository.TeamRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.TeamMemberService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamMemberServiceImpl implements TeamMemberService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<TeamMemberDto> listByTeam(String teamId, boolean activeOnly, Pageable pageable) {
        return teamMemberRepository.findByTeam(teamId, activeOnly, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TeamMemberDto> listHistoryByUser(String userId, Pageable pageable) {
        return teamMemberRepository.findHistoryByUser(userId, pageable).map(this::toDto);
    }

    @Override
    public TeamMemberDto addMember(String teamId, TeamMemberAddRequest request) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        User user = userRepository.findById(request.getUserId()).orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        if (teamMemberRepository.existsActiveMembership(teamId, request.getUserId())) {
            throw new BusinessException("User already active in this team");
        }
        TeamMember tm = new TeamMember();
        tm.setTeam(team);
        tm.setUser(user);
        tm.setStatus("ACTIVE");
        tm.setJoinedAt(LocalDateTime.now());
        return toDto(teamMemberRepository.save(tm));
    }

    @Override
    public TeamMemberDto removeMember(String teamId, String userId, TeamMemberRemoveRequest request) {
        TeamMember tm = teamMemberRepository.findByTeam(teamId, true, Pageable.ofSize(1))
                .stream().filter(m -> m.getUser().getId().equals(userId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("TeamMember", "teamId/userId", teamId + "/" + userId));
        tm.setStatus("REMOVED");
        tm.setLeftAt(LocalDateTime.now());
        return toDto(teamMemberRepository.save(tm));
    }

    @Override
    public Page<TeamMemberDto> bulkAddMembers(String teamId, TeamMemberBulkAddRequest request, Pageable pageable) {
        for (String userId : request.getUserIds()) {
            try {
                addMember(teamId, new TeamMemberAddRequest() {{ setUserId(userId); }});
            } catch (Exception ignored) { }
        }
        return listByTeam(teamId, true, pageable);
    }

    @Override
    public TeamMemberDto reAddMember(String teamId, String userId) {
        // Simply add again if not active
        if (teamMemberRepository.existsActiveMembership(teamId, userId)) {
            throw new BusinessException("User already active in this team");
        }
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        TeamMember tm = new TeamMember();
        tm.setTeam(team);
        tm.setUser(user);
        tm.setStatus("ACTIVE");
        tm.setJoinedAt(LocalDateTime.now());
        return toDto(teamMemberRepository.save(tm));
    }

    private TeamMemberDto toDto(TeamMember entity) {
        return TeamMemberDto.builder()
                .id(entity.getId())
                .teamId(entity.getTeam() != null ? entity.getTeam().getId() : null)
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .status(entity.getStatus())
                .joinedAt(entity.getJoinedAt())
                .leftAt(entity.getLeftAt())
                .build();
    }
}



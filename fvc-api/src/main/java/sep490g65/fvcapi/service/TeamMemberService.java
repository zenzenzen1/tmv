package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.teammember.TeamMemberAddRequest;
import sep490g65.fvcapi.dto.teammember.TeamMemberBulkAddRequest;
import sep490g65.fvcapi.dto.teammember.TeamMemberDto;
import sep490g65.fvcapi.dto.teammember.TeamMemberRemoveRequest;

public interface TeamMemberService {
    Page<TeamMemberDto> listByTeam(String teamId, boolean activeOnly, Pageable pageable);
    Page<TeamMemberDto> listHistoryByUser(String userId, Pageable pageable);
    TeamMemberDto addMember(String teamId, TeamMemberAddRequest request);
    TeamMemberDto removeMember(String teamId, String userId, TeamMemberRemoveRequest request);
    Page<TeamMemberDto> bulkAddMembers(String teamId, TeamMemberBulkAddRequest request, Pageable pageable);
    TeamMemberDto reAddMember(String teamId, String userId);
}



package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.response.ClubMemberDetailResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;

public interface ClubMemberService {
    ClubMemberDetailResponse getDetail(String id);

    PaginationResponse<ClubMemberDetailResponse> list(int page, int size);
}



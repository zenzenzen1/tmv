package sep490g65.fvcapi.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.ClubMemberDetailResponse;
import sep490g65.fvcapi.service.ClubMemberService;
import sep490g65.fvcapi.utils.ResponseUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.response.PaginationResponse;


@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/clubs/members")
@RequiredArgsConstructor
public class ClubMemberController {
    private final ClubMemberService clubMemberService;

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<ClubMemberDetailResponse>> getDetail(@PathVariable String id) {
        ClubMemberDetailResponse dto = clubMemberService.getDetail(id);
        return ResponseEntity.ok(ResponseUtils.success("Club member detail", dto));
    }

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<ClubMemberDetailResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var payload = clubMemberService.list(page, size);
        return ResponseEntity.ok(ResponseUtils.success("Club members retrieved", payload));
    }
}



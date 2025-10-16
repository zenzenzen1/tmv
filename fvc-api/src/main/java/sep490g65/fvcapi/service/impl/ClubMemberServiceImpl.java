package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import sep490g65.fvcapi.dto.response.ClubMemberDetailResponse;
import sep490g65.fvcapi.entity.ClubMember;
import sep490g65.fvcapi.repository.ClubMemberRepository;
import sep490g65.fvcapi.service.ClubMemberService;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClubMemberServiceImpl implements ClubMemberService {
    private final ClubMemberRepository clubMemberRepository;

    @Override
    public ClubMemberDetailResponse getDetail(String id) {
        ClubMember cm = clubMemberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClubMember not found"));

        // Map status to label (có thể tinh chỉnh theo i18n)
        String statusLabel = cm.getStatus() == ClubMember.MemberStatus.ACTIVE
                ? "ĐANG THAM GIA"
                : cm.getStatus() == ClubMember.MemberStatus.PENDING
                ? "CHỜ DUYỆT"
                : "NGỪNG THAM GIA";

        // Tạm thời chưa có bảng log, trả rỗng hoặc có thể lấy từ nguồn khác
        List<String> logs = List.of();

        return ClubMemberDetailResponse.builder()
                .id(cm.getId())
                .fullName(cm.getFullName())
                .email(cm.getEmail())
                .gender(cm.getGender())
                .studentCode(cm.getStudentCode())
                .phone(cm.getPhone())
                .joinedAt(cm.getJoinedAt())
                .department(cm.getDepartment())
                .statusLabel(statusLabel)
                .activityLogs(logs)
                .build();
    }

    @Override
    public PaginationResponse<ClubMemberDetailResponse> list(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ClubMember> res = clubMemberRepository.findAll(pageable);
        Page<ClubMemberDetailResponse> mapped = res.map(cm -> {
            String statusLabel = cm.getStatus() == ClubMember.MemberStatus.ACTIVE
                    ? "ĐANG THAM GIA"
                    : cm.getStatus() == ClubMember.MemberStatus.PENDING
                    ? "CHỜ DUYỆT"
                    : "NGỪNG THAM GIA";
            return ClubMemberDetailResponse.builder()
                    .id(cm.getId())
                    .fullName(cm.getFullName())
                    .email(cm.getEmail())
                    .gender(cm.getGender())
                    .studentCode(cm.getStudentCode())
                    .phone(cm.getPhone())
                    .joinedAt(cm.getJoinedAt())
                    .department(cm.getDepartment())
                    .statusLabel(statusLabel)
                    .activityLogs(List.of())
                    .build();
        });
        return ResponseUtils.createPaginatedResponse(mapped);
    }
}



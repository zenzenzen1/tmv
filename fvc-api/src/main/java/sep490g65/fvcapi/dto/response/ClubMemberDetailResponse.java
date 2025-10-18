package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubMemberDetailResponse {
    private String id;
    private String fullName;
    private String email;
    private String gender;
    private String studentCode;
    private String phone;
    private LocalDate joinedAt;
    private String department;
    private String statusLabel; // e.g., "ĐANG THAM GIA"
    private List<String> activityLogs; // e.g., ["FA23: ...", "SP25: ..."]
}



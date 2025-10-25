package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.Athlete;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AthleteResponse {
    
    private UUID id;
    private String tournamentId;
    private String fullName;
    private String email;
    private String studentId;
    private Athlete.Gender gender;
    private String club;
    private Athlete.CompetitionType competitionType;
    private String subCompetitionType;
    private String detailSubCompetitionType;
    private Athlete.AthleteStatus status;
    private Integer order;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional fields for display
    private String tournamentName;
    private String contentName;
    
    // Helper method to get display status
    public String getDisplayStatus() {
        if (status == null) return "-";
        return switch (status) {
            case NOT_STARTED -> "CHỜ ĐẤU";
            case IN_PROGRESS -> "ĐANG ĐẤU";
            case DONE -> "ĐÃ ĐẤU";
            case VIOLATED -> "VI PHẠM";
        };
    }
    
    // Helper method to get display gender
    public String getDisplayGender() {
        if (gender == null) return "-";
        return gender == Athlete.Gender.MALE ? "Nam" : "Nữ";
    }
    
    // Helper method to get display competition type
    public String getDisplayCompetitionType() {
        if (competitionType == null) return "-";
        return switch (competitionType) {
            case fighting -> "Đối kháng";
            case quyen -> "Quyền";
            case music -> "Võ nhạc";
        };
    }
}

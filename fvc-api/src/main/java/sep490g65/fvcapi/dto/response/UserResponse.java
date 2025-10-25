package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.SystemRole;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private String id;
    private String fullName;
    private String personalMail;
    private String eduMail;
    private String studentCode;
    private LocalDate dob;
    private String gender;
    private SystemRole systemRole;
    private Boolean status;
    private LocalDateTime createdAt;
    
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .eduMail(user.getEduMail())
                .studentCode(user.getStudentCode())
                .dob(user.getDob())
                .gender(user.getGender())
                .systemRole(user.getSystemRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

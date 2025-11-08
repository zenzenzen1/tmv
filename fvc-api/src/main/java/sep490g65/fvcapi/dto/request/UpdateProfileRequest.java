package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    
    @Size(max = 255, message = "Họ và tên không được vượt quá 255 ký tự")
    @Pattern(
        regexp = "^[\\p{L}\\p{M} ]+$",
        message = "Họ và tên chỉ được chứa chữ cái và khoảng trắng, không được chứa số hoặc ký tự đặc biệt"
    )
    private String fullName;
    
    @Email(message = "Email không đúng định dạng")
    @Pattern(
        regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        message = "Email không đúng định dạng"
    )
    @Size(max = 50, message = "Email không được vượt quá 50 ký tự")
    private String personalMail;
    
    @Email(message = "Email không đúng định dạng")
    @Pattern(
        regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        message = "Email không đúng định dạng"
    )
    @Size(max = 50,message = "Email không được vượt quá 50 ký tự")
    private String eduMail;
    
    private String studentCode;
    
    private String gender;
    
    @Pattern(
        regexp = "^\\d{4}-\\d{2}-\\d{2}$",
        message = "Ngày sinh phải có định dạng YYYY-MM-DD (ví dụ: 2000-01-15)"
    )
    private String dob; // Frontend sends as string, will be converted to LocalDate in service
}

package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormDataValidationRequest {
    
    // Tên - bắt buộc nếu không có user_id
    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    @Pattern(regexp = "^[\\p{L}\\s]+$", message = "Tên chỉ được chứa chữ cái và khoảng trắng")
    private String name;
    
    @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
    @Pattern(regexp = "^[\\p{L}\\s]+$", message = "Họ và tên chỉ được chứa chữ cái và khoảng trắng")
    private String fullName;
    
    @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
    @Pattern(regexp = "^[\\p{L}\\s]+$", message = "Họ và tên chỉ được chứa chữ cái và khoảng trắng")
    private String hovaten;
    
    @Size(max = 50, message = "Tên không được vượt quá 50 ký tự")
    @Pattern(regexp = "^[\\p{L}\\s]+$", message = "Tên chỉ được chứa chữ cái và khoảng trắng")
    private String ten;
    
    // Email - bắt buộc nếu không có user_id
    @Email(message = "Email không đúng định dạng")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    private String email;
    
    // Số điện thoại - bắt buộc
    @Pattern(regexp = "^(0|\\+84)[3-9]\\d{8}$", message = "Số điện thoại không đúng định dạng (VD: 0123456789 hoặc +84123456789)")
    private String phone;
    
    @Pattern(regexp = "^(0|\\+84)[3-9]\\d{8}$", message = "Số điện thoại không đúng định dạng (VD: 0123456789 hoặc +84123456789)")
    private String sdt;
    
    @Pattern(regexp = "^(0|\\+84)[3-9]\\d{8}$", message = "Số điện thoại không đúng định dạng (VD: 0123456789 hoặc +84123456789)")
    private String mobile;
    
    // MSSV - bắt buộc nếu không có user_id
    @Pattern(regexp = "^(HE|SE|SS|SP)?\\d{6,8}$", message = "MSSV không đúng định dạng (VD: HE123456, SE1234567)")
    @Size(max = 10, message = "MSSV không được vượt quá 10 ký tự")
    private String studentCode;
    
    @Pattern(regexp = "^(HE|SE|SS|SP)?\\d{6,8}$", message = "MSSV không đúng định dạng (VD: HE123456, SE1234567)")
    @Size(max = 10, message = "MSSV không được vượt quá 10 ký tự")
    private String mssv;
    
    @Pattern(regexp = "^(HE|SE|SS|SP)?\\d{6,8}$", message = "MSSV không đúng định dạng (VD: HE123456, SE1234567)")
    @Size(max = 10, message = "MSSV không được vượt quá 10 ký tự")
    private String msv;
    
    // Lý do tham gia
    @Size(max = 500, message = "Lý do tham gia không được vượt quá 500 ký tự")
    private String reason;
    
    @Size(max = 500, message = "Lý do tham gia không được vượt quá 500 ký tự")
    private String lydo;
    
    @Size(max = 500, message = "Động lực tham gia không được vượt quá 500 ký tự")
    private String motivation;
    
    // Câu lạc bộ
    @Size(max = 100, message = "Tên câu lạc bộ không được vượt quá 100 ký tự")
    private String club;
    
    @Size(max = 100, message = "Tên câu lạc bộ không được vượt quá 100 ký tự")
    private String clb;
    
    // Thông tin bổ sung
    @Size(max = 1000, message = "Thông tin bổ sung không được vượt quá 1000 ký tự")
    private String additional;
    
    @Size(max = 1000, message = "Thông tin bổ sung không được vượt quá 1000 ký tự")
    private String other;
    
    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String note;
    
    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String ghichu;
    
    // Helper methods để kiểm tra validation
    public boolean hasValidName() {
        return (name != null && !name.trim().isEmpty()) ||
               (fullName != null && !fullName.trim().isEmpty()) ||
               (hovaten != null && !hovaten.trim().isEmpty()) ||
               (ten != null && !ten.trim().isEmpty());
    }
    
    public boolean hasValidEmail() {
        return email != null && !email.trim().isEmpty();
    }
    
    public boolean hasValidPhone() {
        return (phone != null && !phone.trim().isEmpty()) ||
               (sdt != null && !sdt.trim().isEmpty()) ||
               (mobile != null && !mobile.trim().isEmpty());
    }
    
    public boolean hasValidStudentCode() {
        return (studentCode != null && !studentCode.trim().isEmpty()) ||
               (mssv != null && !mssv.trim().isEmpty()) ||
               (msv != null && !msv.trim().isEmpty());
    }
    
    public String getValidName() {
        if (name != null && !name.trim().isEmpty()) return name.trim();
        if (fullName != null && !fullName.trim().isEmpty()) return fullName.trim();
        if (hovaten != null && !hovaten.trim().isEmpty()) return hovaten.trim();
        if (ten != null && !ten.trim().isEmpty()) return ten.trim();
        return null;
    }
    
    public String getValidEmail() {
        return email != null ? email.trim() : null;
    }
    
    public String getValidPhone() {
        if (phone != null && !phone.trim().isEmpty()) return phone.trim();
        if (sdt != null && !sdt.trim().isEmpty()) return sdt.trim();
        if (mobile != null && !mobile.trim().isEmpty()) return mobile.trim();
        return null;
    }
    
    public String getValidStudentCode() {
        if (studentCode != null && !studentCode.trim().isEmpty()) return studentCode.trim();
        if (mssv != null && !mssv.trim().isEmpty()) return mssv.trim();
        if (msv != null && !msv.trim().isEmpty()) return msv.trim();
        return null;
    }
}

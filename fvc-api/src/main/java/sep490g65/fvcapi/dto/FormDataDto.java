package sep490g65.fvcapi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FormDataDto {
    
    @JsonProperty("fullName")
    private String fullName;
    
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("gender")
    private String gender;
    
    @JsonProperty("phone")
    private String phone;
    
    @JsonProperty("sdt")
    private String sdt;
    
    @JsonProperty("mobile")
    private String mobile;
    
    @JsonProperty("phoneNumber")
    private String phoneNumber;
    
    @JsonProperty("studentCode")
    private String studentCode;
    
    @JsonProperty("mssv")
    private String mssv;
    
    @JsonProperty("msv")
    private String msv;
    
    @JsonProperty("department")
    private String department;
    
    @JsonProperty("phongBan")
    private String phongBan;
    
    @JsonProperty("khoa")
    private String khoa;
    
    // Helper method to get phone from any field
    public String getPhoneValue() {
        if (phone != null && !phone.trim().isEmpty()) return phone.trim();
        if (sdt != null && !sdt.trim().isEmpty()) return sdt.trim();
        if (mobile != null && !mobile.trim().isEmpty()) return mobile.trim();
        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) return phoneNumber.trim();
        return null;
    }
    
    // Helper method to get student code from any field
    public String getStudentCodeValue() {
        if (studentCode != null && !studentCode.trim().isEmpty()) return studentCode.trim();
        if (mssv != null && !mssv.trim().isEmpty()) return mssv.trim();
        if (msv != null && !msv.trim().isEmpty()) return msv.trim();
        return null;
    }
    
    // Helper method to get department from any field
    public String getDepartmentValue() {
        if (department != null && !department.trim().isEmpty()) return department.trim();
        if (phongBan != null && !phongBan.trim().isEmpty()) return phongBan.trim();
        if (khoa != null && !khoa.trim().isEmpty()) return khoa.trim();
        return null;
    }
}

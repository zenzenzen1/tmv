package sep490g65.fvcapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sep490g65.fvcapi.dto.request.FormDataValidationRequest;
import sep490g65.fvcapi.exception.custom.ValidationException;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class FormDataValidationService {
    
    private final Validator validator;
    private final ObjectMapper objectMapper;
    
    /**
     * Validate form data JSON string
     * @param formDataJson JSON string containing form data
     * @param hasUserId whether the form has associated user_id
     * @return validated and cleaned form data
     * @throws ValidationException if validation fails
     */
    public Map<String, Object> validateFormData(String formDataJson, boolean hasUserId) throws com.fasterxml.jackson.core.JsonProcessingException {
        if (formDataJson == null || formDataJson.trim().isEmpty()) {
            throw new ValidationException("formData", "Form data is required");
        }
        
        try {
            // Parse JSON to Map
            Map<String, Object> formDataMap = objectMapper.readValue(formDataJson, Map.class);
            
            // Convert to validation request object
            FormDataValidationRequest validationRequest = convertToValidationRequest(formDataMap);
            
            // Validate using Bean Validation
            Set<ConstraintViolation<FormDataValidationRequest>> violations = validator.validate(validationRequest);
            
            if (!violations.isEmpty()) {
                Map<String, String> errors = new HashMap<>();
                for (ConstraintViolation<FormDataValidationRequest> violation : violations) {
                    errors.put(violation.getPropertyPath().toString(), violation.getMessage());
                }
                throw new ValidationException(errors);
            }
            
            // Additional business validation
            validateBusinessRules(validationRequest, hasUserId);
            
            // Return cleaned and validated data
            return cleanAndValidateFormData(formDataMap, validationRequest);
            
        } catch (Exception e) {
            log.error("Error validating form data: {}", e.getMessage());
            if (e instanceof ValidationException) {
                throw (ValidationException) e;
            }
            throw new ValidationException("formData", "Invalid JSON format: " + e.getMessage());
        }
    }
    
    /**
     * Convert Map to FormDataValidationRequest for validation
     */
    private FormDataValidationRequest convertToValidationRequest(Map<String, Object> formDataMap) {
        FormDataValidationRequest.FormDataValidationRequestBuilder builder = FormDataValidationRequest.builder();
        
        // Convert all values to String for validation
        for (Map.Entry<String, Object> entry : formDataMap.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            String stringValue = value != null ? value.toString() : null;
            
            switch (key.toLowerCase()) {
                case "name":
                    builder.name(stringValue);
                    break;
                case "fullname":
                case "full_name":
                    builder.fullName(stringValue);
                    break;
                case "hovaten":
                case "ho_ten":
                    builder.hovaten(stringValue);
                    break;
                case "ten":
                    builder.ten(stringValue);
                    break;
                case "email":
                    builder.email(stringValue);
                    break;
                case "phone":
                    builder.phone(stringValue);
                    break;
                case "sdt":
                    builder.sdt(stringValue);
                    break;
                case "mobile":
                    builder.mobile(stringValue);
                    break;
                case "studentcode":
                case "student_code":
                    builder.studentCode(stringValue);
                    break;
                case "mssv":
                    builder.mssv(stringValue);
                    break;
                case "msv":
                    builder.msv(stringValue);
                    break;
                case "reason":
                    builder.reason(stringValue);
                    break;
                case "lydo":
                case "ly_do":
                    builder.lydo(stringValue);
                    break;
                case "motivation":
                    builder.motivation(stringValue);
                    break;
                case "club":
                    builder.club(stringValue);
                    break;
                case "clb":
                    builder.clb(stringValue);
                    break;
                case "additional":
                    builder.additional(stringValue);
                    break;
                case "other":
                    builder.other(stringValue);
                    break;
                case "note":
                    builder.note(stringValue);
                    break;
                case "ghichu":
                case "ghi_chu":
                    builder.ghichu(stringValue);
                    break;
            }
        }
        
        return builder.build();
    }
    
    /**
     * Validate business rules
     */
    private void validateBusinessRules(FormDataValidationRequest request, boolean hasUserId) {
        Map<String, String> errors = new HashMap<>();
        
        // If no user_id, then name, email, and student code are required
        if (!hasUserId) {
            if (!request.hasValidName()) {
                errors.put("name", "Tên là bắt buộc khi không có thông tin người dùng");
            }
            if (!request.hasValidEmail()) {
                errors.put("email", "Email là bắt buộc khi không có thông tin người dùng");
            }
            if (!request.hasValidStudentCode()) {
                errors.put("studentCode", "MSSV là bắt buộc khi không có thông tin người dùng");
            }
        }
        
        // Phone is always required
        if (!request.hasValidPhone()) {
            errors.put("phone", "Số điện thoại là bắt buộc");
        }
        
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }
    
    /**
     * Clean and validate form data, removing invalid fields
     */
    private Map<String, Object> cleanAndValidateFormData(Map<String, Object> originalData, FormDataValidationRequest validatedRequest) {
        Map<String, Object> cleanedData = new HashMap<>();
        
        // Add validated fields
        if (validatedRequest.getValidName() != null) {
            cleanedData.put("name", validatedRequest.getValidName());
        }
        if (validatedRequest.getValidEmail() != null) {
            cleanedData.put("email", validatedRequest.getValidEmail());
        }
        if (validatedRequest.getValidPhone() != null) {
            cleanedData.put("phone", validatedRequest.getValidPhone());
        }
        if (validatedRequest.getValidStudentCode() != null) {
            cleanedData.put("studentCode", validatedRequest.getValidStudentCode());
        }
        
        // Add other validated fields
        if (validatedRequest.getReason() != null && !validatedRequest.getReason().trim().isEmpty()) {
            cleanedData.put("reason", validatedRequest.getReason().trim());
        }
        if (validatedRequest.getLydo() != null && !validatedRequest.getLydo().trim().isEmpty()) {
            cleanedData.put("lydo", validatedRequest.getLydo().trim());
        }
        if (validatedRequest.getMotivation() != null && !validatedRequest.getMotivation().trim().isEmpty()) {
            cleanedData.put("motivation", validatedRequest.getMotivation().trim());
        }
        if (validatedRequest.getClub() != null && !validatedRequest.getClub().trim().isEmpty()) {
            cleanedData.put("club", validatedRequest.getClub().trim());
        }
        if (validatedRequest.getClb() != null && !validatedRequest.getClb().trim().isEmpty()) {
            cleanedData.put("clb", validatedRequest.getClb().trim());
        }
        if (validatedRequest.getAdditional() != null && !validatedRequest.getAdditional().trim().isEmpty()) {
            cleanedData.put("additional", validatedRequest.getAdditional().trim());
        }
        if (validatedRequest.getOther() != null && !validatedRequest.getOther().trim().isEmpty()) {
            cleanedData.put("other", validatedRequest.getOther().trim());
        }
        if (validatedRequest.getNote() != null && !validatedRequest.getNote().trim().isEmpty()) {
            cleanedData.put("note", validatedRequest.getNote().trim());
        }
        if (validatedRequest.getGhichu() != null && !validatedRequest.getGhichu().trim().isEmpty()) {
            cleanedData.put("ghichu", validatedRequest.getGhichu().trim());
        }
        
        // Add any other fields that don't need validation but should be preserved
        for (Map.Entry<String, Object> entry : originalData.entrySet()) {
            String key = entry.getKey().toLowerCase();
            if (!cleanedData.containsKey(key) && 
                !key.matches("^(name|fullname|full_name|hovaten|ho_ten|ten|email|phone|sdt|mobile|studentcode|student_code|mssv|msv|reason|lydo|ly_do|motivation|club|clb|additional|other|note|ghichu|ghi_chu)$")) {
                // Preserve unknown fields but limit their length
                String value = entry.getValue() != null ? entry.getValue().toString() : "";
                if (value.length() <= 1000) { // Limit unknown fields to 1000 characters
                    cleanedData.put(entry.getKey(), value);
                }
            }
        }
        
        return cleanedData;
    }
}

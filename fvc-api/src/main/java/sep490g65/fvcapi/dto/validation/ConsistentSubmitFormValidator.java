package sep490g65.fvcapi.dto.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import sep490g65.fvcapi.dto.request.SubmitApplicationFormRequest;
import sep490g65.fvcapi.dto.request.SubmittedFormData;

public class ConsistentSubmitFormValidator implements ConstraintValidator<ConsistentSubmitForm, SubmitApplicationFormRequest> {
    @Override
    public boolean isValid(SubmitApplicationFormRequest value, ConstraintValidatorContext context) {
        if (value == null) return true;
        SubmittedFormData data = value.getFormData();
        if (data == null) return false;

        boolean hasUser = value.getUserId() != null && !value.getUserId().trim().isEmpty();

        boolean ok = true;
        context.disableDefaultConstraintViolation();

        // Phone is always required
        if (data.getPhone() == null || data.getPhone().trim().isEmpty()) {
            context.buildConstraintViolationWithTemplate("Phone is required")
                    .addPropertyNode("formData.phone").addConstraintViolation();
            ok = false;
        }

        // If no user, require name/email/studentCode
        if (!hasUser) {
            if (isBlank(data.getFullName()) && isBlank(data.getName())) {
                context.buildConstraintViolationWithTemplate("Name is required when userId is absent")
                        .addPropertyNode("formData.fullName").addConstraintViolation();
                ok = false;
            }
            if (isBlank(data.getEmail())) {
                context.buildConstraintViolationWithTemplate("Email is required when userId is absent")
                        .addPropertyNode("formData.email").addConstraintViolation();
                ok = false;
            }
            if (isBlank(data.getStudentCode())) {
                context.buildConstraintViolationWithTemplate("Student code is required when userId is absent")
                        .addPropertyNode("formData.studentCode").addConstraintViolation();
                ok = false;
            }
        }

        return ok;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}

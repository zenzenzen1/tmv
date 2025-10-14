package sep490g65.fvcapi.dto.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Documented
@Target({TYPE})
@Retention(RUNTIME)
@Constraint(validatedBy = ConsistentSubmitFormValidator.class)
public @interface ConsistentSubmitForm {
    String message() default "Invalid submit form data";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

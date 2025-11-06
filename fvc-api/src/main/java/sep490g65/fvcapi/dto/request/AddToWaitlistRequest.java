package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToWaitlistRequest {

    @NotBlank(message = "Application form config ID is required")
    private String applicationFormConfigId;

    @NotNull(message = "Form data is required")
    private Map<String, Object> formData;

    @NotBlank(message = "Email is required")
    private String email;
}


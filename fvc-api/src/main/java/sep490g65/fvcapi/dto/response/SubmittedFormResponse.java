package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.ApplicationFormStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmittedFormResponse {
    private Long id;
    private String formData;
    private ApplicationFormStatus status;
}



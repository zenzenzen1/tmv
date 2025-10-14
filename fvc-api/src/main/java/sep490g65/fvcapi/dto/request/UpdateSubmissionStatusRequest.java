package sep490g65.fvcapi.dto.request;

import lombok.Data;
import sep490g65.fvcapi.enums.ApplicationFormStatus;

@Data
public class UpdateSubmissionStatusRequest {
    private ApplicationFormStatus status;
}



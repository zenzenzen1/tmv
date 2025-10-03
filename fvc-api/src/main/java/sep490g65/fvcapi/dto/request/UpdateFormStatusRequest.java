package sep490g65.fvcapi.dto.request;

import lombok.Data;
import sep490g65.fvcapi.enums.FormStatus;

@Data
public class UpdateFormStatusRequest {
    private FormStatus status;
}



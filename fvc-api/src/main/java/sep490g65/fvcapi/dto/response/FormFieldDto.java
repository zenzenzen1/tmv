package sep490g65.fvcapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormFieldDto {
    private String id;
    private String label;
    private String name;
    private String fieldType;
    private Boolean required;
    private String options; // json string
    private Integer sortOrder;
}



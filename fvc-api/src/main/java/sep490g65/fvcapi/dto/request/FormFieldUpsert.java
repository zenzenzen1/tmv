package sep490g65.fvcapi.dto.request;

import lombok.Data;

@Data
public class FormFieldUpsert {
    private String id; // null for new
    private String label;
    private String name;
    private String fieldType;
    private Boolean required;
    private String options; // json string
    private Integer sortOrder;
}



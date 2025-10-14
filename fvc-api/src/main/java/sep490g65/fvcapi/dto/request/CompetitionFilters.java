package sep490g65.fvcapi.dto.request;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class CompetitionFilters extends RequestParam {
    
    private String status;
    private String year;
    private String location;
    
    // Inherits from RequestParam: page, size, sortBy, sortDirection, search
}

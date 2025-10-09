package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.constants.ApiConstants;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestParam {

    @Min(value = 0, message = "Page number must be 0 or greater")
    @Builder.Default
    private Integer page = 0;

    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = ApiConstants.MAX_PAGE_SIZE, message = "Page size cannot exceed " + ApiConstants.MAX_PAGE_SIZE)
    @Builder.Default
    private Integer size = ApiConstants.DEFAULT_PAGE_SIZE;

    @Builder.Default
    private String sortBy = ApiConstants.DEFAULT_SORT_BY;

    @Builder.Default
    @Pattern(regexp = "(?i)asc|desc", message = "Sort direction must be 'asc' or 'desc'")
    private String sortDirection = ApiConstants.DEFAULT_SORT_DIRECTION;

    @Size(max = 100, message = "Search term too long (max 100)")
    private String search;

    private String status;

    private String dateFrom;

    private String dateTo;

    // Helper methods
    public boolean isAscending() {
        return "asc".equalsIgnoreCase(sortDirection);
    }

    public boolean isDescending() {
        return "desc".equalsIgnoreCase(sortDirection);
    }

    public boolean hasSearch() {
        return search != null && !search.trim().isEmpty();
    }

    public boolean hasStatus() {
        return status != null && !status.trim().isEmpty();
    }

    public boolean hasDateRange() {
        return dateFrom != null && dateTo != null;
    }

    public String getSearchTerm() {
        return hasSearch() ? search.trim() : null;
    }

    public String getStatusFilter() {
        return hasStatus() ? status.trim() : null;
    }
}
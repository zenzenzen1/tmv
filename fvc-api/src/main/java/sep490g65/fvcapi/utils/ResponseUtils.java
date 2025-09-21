package sep490g65.fvcapi.utils;

import org.springframework.data.domain.Page;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;

public final class ResponseUtils {
    private ResponseUtils() {
        // Utility class
    }

    public static <T> BaseResponse<T> success(String message) {
        return BaseResponse.success(message);
    }

    public static <T> BaseResponse<T> success(String message, T data) {
        return BaseResponse.success(message, data);
    }

    public static <T> BaseResponse<T> error(String message, String errorCode) {
        return BaseResponse.error(message, errorCode);
    }

    public static <T> PaginationResponse<T> createPaginatedResponse(Page<T> page) {
        return PaginationResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
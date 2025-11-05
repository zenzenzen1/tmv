package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.ContentType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RandomizeArrangeOrderRequest {
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    @NotNull(message = "Content type is required")
    private ContentType contentType;
    
    @Builder.Default
    private Boolean randomize = true; // Whether to shuffle order within sections
    
    // Optional filters
    private String gender; // MALE, FEMALE, or null for all
    private String formType; // Song luyện, Đơn Luyện, Đồng Đội, Đa Luyện (only for QUYEN)
}


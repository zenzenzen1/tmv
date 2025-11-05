package sep490g65.fvcapi.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sep490g65.fvcapi.enums.ContentType;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveArrangeOrderRequest {
    
    @NotBlank(message = "Competition ID is required")
    private String competitionId;
    
    @NotNull(message = "Content type is required")
    private ContentType contentType;
    
    @NotEmpty(message = "Sections are required")
    @Valid
    private List<SectionDto> sections;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionDto {
        @NotBlank(message = "Content ID is required")
        private String contentId;
        
        @NotNull(message = "Items are required")
        @Valid
        private List<ItemDto> items;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto {
        @NotBlank(message = "Item ID is required")
        private String id;
        
        @NotNull(message = "Item type is required")
        private sep490g65.fvcapi.enums.ArrangeItemType type;
        
        @NotNull(message = "Order index is required")
        private Integer orderIndex;
    }
}


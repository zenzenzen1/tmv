package sep490g65.fvcapi.dto.response;

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
public class ArrangeOrderResponse {
    
    private ContentType contentType;
    private String competitionName;
    private List<SectionDto> sections;
    private List<ArrangeItemDto> pool;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionDto {
        private String contentId;
        private String contentName;
        private List<ArrangeItemDto> items;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArrangeItemDto {
        private String id;
        private sep490g65.fvcapi.enums.ArrangeItemType type;
        private String name;
        private String gender; // MALE, FEMALE, MIXED
        private String studentCode;
        private String formType; // Only for QUYEN: Song luyện, Đơn Luyện, Đồng Đội, Đa Luyện
        private String contentId;
        private Integer orderIndex;
        private List<MemberDto> members; // Only for TEAM type
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberDto {
        private String id;
        private String name;
        private String gender;
        private String studentCode;
        private String formType; // Only for QUYEN
        private String contentId;
    }
}


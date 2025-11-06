package sep490g65.fvcapi.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMusicContentRequest {
    @Size(max = 255, message = "Name must not exceed 255 characters")
    @Pattern(
            regexp = "^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠăâêôơ0-9\\s\\.,!\\?_()\\-]+$",
            message = "Nội dung Võ nhạc không được chứa ký tự đặc biệt"
    )
    private String name;
    
    @Size(max = 255, message = "Note must not exceed 255 characters")
    private String description;
    
    private Boolean isActive;

    private Integer performersPerEntry;
}



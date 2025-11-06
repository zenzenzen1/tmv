package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.request.AddToWaitlistRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.service.WaitlistService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/waitlist")
@RequiredArgsConstructor
@Slf4j
public class WaitlistController {

    private final WaitlistService waitlistService;

    @PostMapping("/add")
    public ResponseEntity<BaseResponse<Void>> addToWaitlist(@Valid @RequestBody AddToWaitlistRequest request) {
        log.info("🔄 [WaitlistController] Received request to add to waitlist. Form: {}, Email: {}", 
                request.getApplicationFormConfigId(), request.getEmail());
        try {
            waitlistService.addToWaitlist(request);
            log.info("✅ [WaitlistController] Successfully added to waitlist");
            return ResponseEntity.ok(ResponseUtils.success("Đã thêm vào danh sách chờ thành công"));
        } catch (Exception e) {
            log.error("❌ [WaitlistController] Error adding to waitlist", e);
            return ResponseEntity.ok(ResponseUtils.error(
                    e.getMessage() != null ? e.getMessage() : "Không thể thêm vào danh sách chờ", 
                    "WAITLIST_ERROR"));
        }
    }
}


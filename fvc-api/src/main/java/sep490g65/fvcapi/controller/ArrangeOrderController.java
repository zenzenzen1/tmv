package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.constants.MessageConstants;
import sep490g65.fvcapi.dto.request.RandomizeArrangeOrderRequest;
import sep490g65.fvcapi.dto.request.SaveArrangeOrderRequest;
import sep490g65.fvcapi.dto.response.ArrangeOrderResponse;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.ContentItemResponse;
import sep490g65.fvcapi.enums.ContentType;
import sep490g65.fvcapi.service.ArrangeOrderService;
import sep490g65.fvcapi.utils.ResponseUtils;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + "/competitions/{competitionId}/arrange-order")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('EXECUTIVE_BOARD', 'ORGANIZATION_COMMITTEE', 'ADMIN')")
public class ArrangeOrderController {

    private final ArrangeOrderService arrangeOrderService;

    @GetMapping
    public ResponseEntity<BaseResponse<ArrangeOrderResponse>> getArrangeOrder(
            @PathVariable String competitionId,
            @RequestParam ContentType contentType) {
        try {
            ArrangeOrderResponse data = arrangeOrderService.getArrangeOrder(competitionId, contentType);
            return ResponseEntity.ok(ResponseUtils.success("Arrange order retrieved successfully", data));
        } catch (Exception e) {
            log.error("Error fetching arrange order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to fetch arrange order", "ARRANGE_004"));
        }
    }

    @PostMapping
    public ResponseEntity<BaseResponse<Void>> saveArrangeOrder(
            @PathVariable String competitionId,
            @Valid @RequestBody SaveArrangeOrderRequest request) {
        try {
            request.setCompetitionId(competitionId);
            arrangeOrderService.saveArrangeOrder(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseUtils.success("Arrange order saved successfully"));
        } catch (Exception e) {
            log.error("Error saving arrange order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to save arrange order", "ARRANGE_002"));
        }
    }

    @PostMapping("/randomize")
    public ResponseEntity<BaseResponse<ArrangeOrderResponse>> randomizeArrangeOrder(
            @PathVariable String competitionId,
            @Valid @RequestBody RandomizeArrangeOrderRequest request) {
        try {
            request.setCompetitionId(competitionId);
            ArrangeOrderResponse data = arrangeOrderService.randomizeFromRegistrations(request);
            return ResponseEntity.ok(ResponseUtils.success("Arrange order randomized successfully", data));
        } catch (Exception e) {
            log.error("Error randomizing arrange order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to randomize arrange order", "ARRANGE_001"));
        }
    }

    @GetMapping("/content-items")
    public ResponseEntity<BaseResponse<List<ContentItemResponse>>> getContentItems(
            @PathVariable String competitionId,
            @RequestParam ContentType contentType) {
        try {
            List<ContentItemResponse> data = arrangeOrderService.getContentItems(competitionId, contentType);
            return ResponseEntity.ok(ResponseUtils.success("Content items retrieved successfully", data));
        } catch (Exception e) {
            log.error("Error fetching content items", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseUtils.error("Failed to fetch content items", "ARRANGE_005"));
        }
    }
}


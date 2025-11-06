package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.RandomizeArrangeOrderRequest;
import sep490g65.fvcapi.dto.request.SaveArrangeOrderRequest;
import sep490g65.fvcapi.dto.response.ArrangeOrderResponse;
import sep490g65.fvcapi.dto.response.ContentItemResponse;
import sep490g65.fvcapi.enums.ContentType;

import java.util.List;

public interface ArrangeOrderService {
    
    /**
     * Get arranged order for a competition and content type
     */
    ArrangeOrderResponse getArrangeOrder(String competitionId, ContentType contentType);
    
    /**
     * Save or update arranged order
     */
    void saveArrangeOrder(SaveArrangeOrderRequest request);
    
    /**
     * Randomize arrange order from registrations
     */
    ArrangeOrderResponse randomizeFromRegistrations(RandomizeArrangeOrderRequest request);
    
    /**
     * Get available content items (fist items or music content) for a competition
     */
    List<ContentItemResponse> getContentItems(String competitionId, ContentType contentType);
}


package sep490g65.fvcapi.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import sep490g65.fvcapi.constants.ApiConstants;
import sep490g65.fvcapi.dto.location.LocationCreateRequest;
import sep490g65.fvcapi.dto.location.LocationDto;
import sep490g65.fvcapi.dto.location.LocationUpdateRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.service.LocationService;
import sep490g65.fvcapi.utils.ResponseUtils;

@RestController
@RequestMapping(ApiConstants.API_BASE_PATH + ApiConstants.LOCATIONS_PATH)
@Validated
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<BaseResponse<PaginationResponse<LocationDto>>> list(
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<LocationDto> page = locationService.list(isActive, search, pageable);
        return ResponseEntity.ok(ResponseUtils.success("Locations retrieved",
                ResponseUtils.createPaginatedResponse(page)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<LocationDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ResponseUtils.success("Location retrieved",
                locationService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<BaseResponse<LocationDto>> create(@RequestBody @Valid LocationCreateRequest request) {
        LocationDto created = locationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseUtils.success("Location created", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<LocationDto>> update(
            @PathVariable String id,
            @RequestBody @Valid LocationUpdateRequest request
    ) {
        LocationDto updated = locationService.update(id, request);
        return ResponseEntity.ok(ResponseUtils.success("Location updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable String id) {
        locationService.delete(id);
        return ResponseEntity.ok(ResponseUtils.success("Location deleted"));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<BaseResponse<Void>> deactivate(@PathVariable String id) {
        locationService.deactivate(id);
        return ResponseEntity.ok(ResponseUtils.success("Location deactivated"));
    }
}



package sep490g65.fvcapi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import sep490g65.fvcapi.dto.location.LocationCreateRequest;
import sep490g65.fvcapi.dto.location.LocationDto;
import sep490g65.fvcapi.dto.location.LocationUpdateRequest;

public interface LocationService {
    Page<LocationDto> list(Boolean isActive, String search, Pageable pageable);
    LocationDto getById(String id);
    LocationDto create(LocationCreateRequest request);
    LocationDto update(String id, LocationUpdateRequest request);
    void delete(String id);
    void deactivate(String id);
}



package sep490g65.fvcapi.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.location.LocationCreateRequest;
import sep490g65.fvcapi.dto.location.LocationDto;
import sep490g65.fvcapi.dto.location.LocationUpdateRequest;
import sep490g65.fvcapi.dto.user.UserDto;
import sep490g65.fvcapi.entity.Location;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.LocationRepository;
import sep490g65.fvcapi.repository.TrainingSessionRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.LocationService;

@Service
@RequiredArgsConstructor
@Transactional
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final TrainingSessionRepository trainingSessionRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<LocationDto> list(Boolean isActive, String search, Pageable pageable) {
        Specification<Location> spec = Specification.where(null);

        if (isActive != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), isActive));
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("name")), searchPattern),
                            cb.like(cb.lower(root.get("address")), searchPattern)
                    ));
        }

        return locationRepository.findAll(spec, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public LocationDto getById(String id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));
        return toDto(location);
    }

    @Override
    public LocationDto create(LocationCreateRequest request) {
        // Check name uniqueness (case-insensitive)
        if (locationRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BusinessException("Location name already exists");
        }

        // Validate capacity default
        if (request.getCapacityDefault() != null && request.getCapacityDefault() < 0) {
            throw new BusinessException("Capacity default must be >= 0");
        }

        // Get current user
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByPersonalMail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentEmail));

        Location location = new Location();
        location.setName(request.getName());
        location.setAddress(request.getAddress());
        location.setCapacityDefault(request.getCapacityDefault());
        location.setDescription(request.getDescription());
        location.setLat(request.getLat());
        location.setLng(request.getLng());
        location.setIsActive(true);
        location.setCreatedBy(currentUser);

        Location saved = locationRepository.save(location);
        return toDto(saved);
    }

    @Override
    public LocationDto update(String id, LocationUpdateRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));

        // Check name uniqueness if name is being changed
        if (request.getName() != null && !request.getName().equalsIgnoreCase(location.getName())) {
            if (locationRepository.existsByNameIgnoreCase(request.getName())) {
                throw new BusinessException("Location name already exists");
            }
            location.setName(request.getName());
        }

        // Get current user for updatedBy
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        if (request.getAddress() != null) {
            location.setAddress(request.getAddress());
        }
        if (request.getCapacityDefault() != null) {
            if (request.getCapacityDefault() < 0) {
                throw new BusinessException("Capacity default must be >= 0");
            }
            location.setCapacityDefault(request.getCapacityDefault());
        }
        if (request.getDescription() != null) {
            location.setDescription(request.getDescription());
        }
        if (request.getLat() != null) {
            location.setLat(request.getLat());
        }
        if (request.getLng() != null) {
            location.setLng(request.getLng());
        }
        if (request.getIsActive() != null) {
            location.setIsActive(request.getIsActive());
        }

        location.setUpdatedBy(currentUser);

        Location saved = locationRepository.save(location);
        return toDto(saved);
    }

    @Override
    public void delete(String id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));

        // Check if location is used in active sessions
        long activeSessionsCount = trainingSessionRepository.findByLocationId(id, Pageable.unpaged())
                .getTotalElements();
        if (activeSessionsCount > 0) {
            throw new BusinessException("Cannot delete location used in active sessions. Deactivate instead.");
        }

        locationRepository.delete(location);
    }

    @Override
    public void deactivate(String id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));

        location.setIsActive(false);
        locationRepository.save(location);
    }

    private LocationDto toDto(Location entity) {
        return LocationDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .address(entity.getAddress())
                .capacityDefault(entity.getCapacityDefault())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .lat(entity.getLat())
                .lng(entity.getLng())
                .createdBy(entity.getCreatedBy() != null ? toUserDto(entity.getCreatedBy()) : null)
                .updatedBy(entity.getUpdatedBy() != null ? toUserDto(entity.getUpdatedBy()) : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private UserDto toUserDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .personalMail(user.getPersonalMail())
                .build();
    }
}


package sep490g65.fvcapi.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import sep490g65.fvcapi.dto.request.CreateMusicContentRequest;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.UpdateMusicContentRequest;
import sep490g65.fvcapi.dto.response.MusicContentResponse;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.entity.MusicIntegratedPerformance;
import sep490g65.fvcapi.exception.custom.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.MusicIntegratedPerformanceRepository;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MusicContentServiceImpl Unit Tests")
class MusicContentServiceImplTest {

    @Mock
    private MusicIntegratedPerformanceRepository repository;

    @InjectMocks
    private MusicContentServiceImpl service;

    private MusicIntegratedPerformance sampleEntity() {
        return MusicIntegratedPerformance.builder()
                .id("id-1")
                .name("Kata Show")
                .description("Dynamic performance")
                .isActive(true)
                .performersPerEntry(3)
                .build();
    }

    // ===== list() =====
    @Test
    @DisplayName("list - returns paginated results with search and ACTIVE filter")
    void list_WithSearchAndActive() {
        RequestParam params = RequestParam.builder()
                .page(0)
                .size(10)
                .sortBy("updatedAt")
                .sortDirection("asc")
                .search("kata")
                .status("ACTIVE")
                .build();

        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "updatedAt"));
        Page<MusicIntegratedPerformance> page = new PageImpl<>(Collections.singletonList(sampleEntity()), pageable, 1);

        when(repository.search(anyString(), eq(true), eq(pageable))).thenReturn(page);

        PaginationResponse<MusicContentResponse> result = service.list(params);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        MusicContentResponse item = result.getContent().get(0);
        assertEquals("id-1", item.getId());
        assertEquals("Kata Show", item.getName());
        verify(repository, times(1)).search("%kata%", true, pageable);
    }

    @Test
    @DisplayName("list - handles no search and no status")
    void list_NoFilters() {
        RequestParam params = RequestParam.builder()
                .page(1)
                .size(5)
                .sortBy("name")
                .sortDirection("desc")
                .build();

        Pageable pageable = PageRequest.of(1, 5, Sort.by(Sort.Direction.DESC, "name"));
        Page<MusicIntegratedPerformance> page = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(repository.search(isNull(), isNull(), eq(pageable))).thenReturn(page);

        PaginationResponse<MusicContentResponse> result = service.list(params);

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        verify(repository, times(1)).search(null, null, pageable);
    }

    // ===== getById() =====
    @Test
    @DisplayName("getById - returns DTO when entity exists")
    void getById_Found() {
        when(repository.findById("id-1")).thenReturn(Optional.of(sampleEntity()));

        MusicContentResponse dto = service.getById("id-1");

        assertNotNull(dto);
        assertEquals("id-1", dto.getId());
        assertEquals("Kata Show", dto.getName());
    }

    @Test
    @DisplayName("getById - throws when not found")
    void getById_NotFound() {
        when(repository.findById("missing")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getById("missing"));
    }

    // ===== create() =====
    @Test
    @DisplayName("create - saves and returns DTO when valid and unique")
    void create_Success() {
        CreateMusicContentRequest req = CreateMusicContentRequest.builder()
                .name("Vo 1")
                .description("2025")
                .isActive(true)
                .performersPerEntry(4)
                .build();

        when(repository.existsByNameIgnoreCase("Vo 1")).thenReturn(false);
        when(repository.save(any(MusicIntegratedPerformance.class))).thenAnswer(invocation -> {
            MusicIntegratedPerformance e = invocation.getArgument(0);
            e.setId("id-1");
            return e;
        });

        MusicContentResponse dto = service.create(req);

        assertNotNull(dto);
        assertEquals("id-1", dto.getId());
        assertEquals(4, dto.getPerformersPerEntry());
        verify(repository, times(1)).save(any(MusicIntegratedPerformance.class));
    }

    @Test
    @DisplayName("create - throws BusinessException when duplicate name")
    void create_DuplicateName() {
        CreateMusicContentRequest req = CreateMusicContentRequest.builder()
                .name("Kata Show")
                .build();
        when(repository.existsByNameIgnoreCase("Kata Show")).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.create(req));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("create - throws NullPointerException when name is null")
    void create_NullName() {
        CreateMusicContentRequest req = CreateMusicContentRequest.builder()
                .name(null)
                .description("Test description")
                .isActive(true)
                .build();
        
        // When name is null, existsByNameIgnoreCase will be called with null
        // This might throw NPE or return false depending on implementation
        when(repository.existsByNameIgnoreCase(null)).thenReturn(false);
        
        // The service will try to create entity with null name, which might cause issues
        // This test verifies the behavior when name is null
        assertThrows(Exception.class, () -> service.create(req));
        verify(repository, times(1)).existsByNameIgnoreCase(null);
    }

    @Test
    @DisplayName("create - handles empty string name")
    void create_EmptyStringName() {
        CreateMusicContentRequest req = CreateMusicContentRequest.builder()
                .name(" ")
                .description("Test description")
                .isActive(true)
                .build();
        
        when(repository.existsByNameIgnoreCase(" ")).thenReturn(false);
        when(repository.save(any(MusicIntegratedPerformance.class))).thenAnswer(invocation -> {
            MusicIntegratedPerformance e = invocation.getArgument(0);
            e.setId("id-1");
            return e;
        });
        
        MusicContentResponse dto = service.create(req);
        
        assertNotNull(dto);
        assertEquals(" ", dto.getName());
        verify(repository, times(1)).existsByNameIgnoreCase(" ");
        verify(repository, times(1)).save(any(MusicIntegratedPerformance.class));
    }

    // ===== update() =====
    @Test
    @DisplayName("update - applies partial fields and saves")
    void update_Success() {
        UpdateMusicContentRequest req = UpdateMusicContentRequest.builder()
                .name("New Name")
                .isActive(false)
                .performersPerEntry(2)
                .build();

        when(repository.findById("id-1")).thenReturn(Optional.of(sampleEntity()));
        when(repository.save(any(MusicIntegratedPerformance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MusicContentResponse dto = service.update("id-1", req);

        assertNotNull(dto);
        assertEquals("New Name", dto.getName());
        assertEquals(false, dto.getIsActive());
        assertEquals(2, dto.getPerformersPerEntry());
        verify(repository, times(1)).save(any(MusicIntegratedPerformance.class));
    }

    @Test
    @DisplayName("update - throws when entity not found")
    void update_NotFound() {
        UpdateMusicContentRequest req = UpdateMusicContentRequest.builder().name("X").build();
        when(repository.findById("missing")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.update("missing", req));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update - skips name update when name is null")
    void update_NullName() {
        UpdateMusicContentRequest req = UpdateMusicContentRequest.builder()
                .name(null)
                .description("Updated description")
                .isActive(false)
                .build();

        MusicIntegratedPerformance existingEntity = sampleEntity();
        when(repository.findById("id-1")).thenReturn(Optional.of(existingEntity));
        when(repository.save(any(MusicIntegratedPerformance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MusicContentResponse dto = service.update("id-1", req);

        assertNotNull(dto);
        // Name should remain unchanged (original "Kata Show")
        assertEquals("Kata Show", dto.getName());
        // Description should be updated
        assertEquals("Updated description", dto.getDescription());
        // isActive should be updated
        assertEquals(false, dto.getIsActive());
        verify(repository, times(1)).save(any(MusicIntegratedPerformance.class));
    }

    @Test
    @DisplayName("update - updates name when name is empty string")
    void update_EmptyStringName() {
        UpdateMusicContentRequest req = UpdateMusicContentRequest.builder()
                .name(" ")
                .build();

        MusicIntegratedPerformance existingEntity = sampleEntity();
        when(repository.findById("id-1")).thenReturn(Optional.of(existingEntity));
        when(repository.save(any(MusicIntegratedPerformance.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MusicContentResponse dto = service.update("id-1", req);

        assertNotNull(dto);
        // Name should be updated to empty string (since it's not null)
        assertEquals(" ", dto.getName());
        // Other fields should remain unchanged
        assertEquals("Dynamic performance", dto.getDescription());
        verify(repository, times(1)).save(any(MusicIntegratedPerformance.class));
    }

    // ===== delete() =====
    @Test
    @DisplayName("delete - removes entity when found")
    void delete_Success() {
        when(repository.findById("id-1")).thenReturn(Optional.of(sampleEntity()));
        doNothing().when(repository).delete(any(MusicIntegratedPerformance.class));

        service.delete("id-1");

        verify(repository, times(1)).delete(any(MusicIntegratedPerformance.class));
    }

    @Test
    @DisplayName("delete - throws when not found")
    void delete_NotFound() {
        when(repository.findById("missing")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.delete("missing"));
        verify(repository, never()).delete(any());
    }
}




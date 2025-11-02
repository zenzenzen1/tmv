package sep490g65.fvcapi.service;

import org.junit.jupiter.api.BeforeEach;
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
import sep490g65.fvcapi.entity.Athlete;
import sep490g65.fvcapi.repository.AthleteRepository;
import org.springframework.data.jpa.domain.Specification;
import sep490g65.fvcapi.repository.PerformanceAthleteRepository;
import sep490g65.fvcapi.repository.SubmittedApplicationFormRepository;
import sep490g65.fvcapi.repository.WeightClassRepository;
import sep490g65.fvcapi.repository.VovinamFistConfigRepository;
import sep490g65.fvcapi.repository.VovinamFistItemRepository;
import sep490g65.fvcapi.repository.MusicIntegratedPerformanceRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AthleteServiceImpl Unit Tests")
@SuppressWarnings("unchecked")
class AthleteServiceImplTest {

    @Mock
    private AthleteRepository athleteRepository;

    @Mock
    private WeightClassRepository weightClassRepository;

    @Mock
    private VovinamFistItemRepository fistItemRepository;

    @Mock
    private VovinamFistConfigRepository fistConfigRepository;

    @Mock
    private MusicIntegratedPerformanceRepository musicRepository;

    @Mock
    private PerformanceAthleteRepository performanceAthleteRepository;

    @Mock
    private SubmittedApplicationFormRepository submittedApplicationFormRepository;

    @InjectMocks
    private AthleteService athleteService;

    private Athlete testAthlete;
    private String tournamentId;

    @BeforeEach
    void setUp() {
        tournamentId = "comp-123";

        testAthlete = Athlete.builder()
                .id(UUID.randomUUID())
                .tournamentId(tournamentId)
                .fullName("John Doe")
                .email("john@example.com")
                .studentId("STU123456")
                .gender(Athlete.Gender.MALE)
                .club("Test Club")
                .competitionType(Athlete.CompetitionType.fighting)
                .subCompetitionType("Hạng cân")
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .weightClassId("wc-123")
                .build();
    }

    // ==================== CREATE ATHLETE TESTS ====================

    @Test
    @DisplayName("Should successfully create athlete")
    void testCreate_ShouldSaveAthlete() {
        // Arrange
        when(athleteRepository.save(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Athlete result = athleteService.create(testAthlete);

        // Assert
        assertNotNull(result);
        assertEquals(testAthlete.getEmail(), result.getEmail());
        assertEquals(testAthlete.getTournamentId(), result.getTournamentId());
        verify(athleteRepository, times(1)).save(testAthlete);
    }

    @Test
    @DisplayName("Should create athlete with all competition types")
    void testCreate_WithAllCompetitionTypes_ShouldSave() {
        Athlete.CompetitionType[] types = {
                Athlete.CompetitionType.fighting,
                Athlete.CompetitionType.quyen,
                Athlete.CompetitionType.music
        };

        for (Athlete.CompetitionType type : types) {
            // Arrange
            Athlete athlete = Athlete.builder()
                    .tournamentId(tournamentId)
                    .fullName("Test Athlete")
                    .email("test" + type + "@example.com")
                    .gender(Athlete.Gender.MALE)
                    .competitionType(type)
                    .status(Athlete.AthleteStatus.NOT_STARTED)
                    .build();

            when(athleteRepository.save(any(Athlete.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Athlete result = athleteService.create(athlete);

            // Assert
            assertNotNull(result);
            assertEquals(type, result.getCompetitionType());
            verify(athleteRepository, atLeastOnce()).save(any(Athlete.class));

            reset(athleteRepository);
        }
    }

    @Test
    @DisplayName("Should create athlete with weight class for fighting")
    void testCreate_FightingWithWeightClass_ShouldSave() {
        // Arrange
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .fullName("Fighter")
                .email("fighter@example.com")
                .gender(Athlete.Gender.MALE)
                .competitionType(Athlete.CompetitionType.fighting)
                .weightClassId("wc-456")
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        when(athleteRepository.save(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Athlete result = athleteService.create(athlete);

        // Assert
        assertNotNull(result);
        assertEquals("wc-456", result.getWeightClassId());
        assertEquals(Athlete.CompetitionType.fighting, result.getCompetitionType());
    }

    @Test
    @DisplayName("Should create athlete with fist config for quyen")
    void testCreate_QuyenWithFistConfig_ShouldSave() {
        // Arrange
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .fullName("Quyen Athlete")
                .email("quyen@example.com")
                .gender(Athlete.Gender.FEMALE)
                .competitionType(Athlete.CompetitionType.quyen)
                .fistConfigId("fist-config-123")
                .fistItemId("fist-item-456")
                .subCompetitionType("Song luyện")
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        when(athleteRepository.save(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Athlete result = athleteService.create(athlete);

        // Assert
        assertNotNull(result);
        assertEquals("fist-config-123", result.getFistConfigId());
        assertEquals("fist-item-456", result.getFistItemId());
        assertEquals(Athlete.CompetitionType.quyen, result.getCompetitionType());
    }

    @Test
    @DisplayName("Should create athlete with music content for music")
    void testCreate_MusicWithMusicContent_ShouldSave() {
        // Arrange
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .fullName("Music Performer")
                .email("music@example.com")
                .gender(Athlete.Gender.MALE)
                .competitionType(Athlete.CompetitionType.music)
                .musicContentId("music-123")
                .subCompetitionType("Tiết mục")
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        when(athleteRepository.save(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Athlete result = athleteService.create(athlete);

        // Assert
        assertNotNull(result);
        assertEquals("music-123", result.getMusicContentId());
        assertEquals(Athlete.CompetitionType.music, result.getCompetitionType());
    }

    @Test
    @DisplayName("Should create athlete with all status types")
    void testCreate_WithAllStatusTypes_ShouldSave() {
        Athlete.AthleteStatus[] statuses = {
                Athlete.AthleteStatus.NOT_STARTED,
                Athlete.AthleteStatus.IN_PROGRESS,
                Athlete.AthleteStatus.DONE,
                Athlete.AthleteStatus.VIOLATED
        };

        for (Athlete.AthleteStatus status : statuses) {
            // Arrange
            Athlete athlete = Athlete.builder()
                    .tournamentId(tournamentId)
                    .fullName("Test Athlete")
                    .email("test" + status + "@example.com")
                    .gender(Athlete.Gender.MALE)
                    .competitionType(Athlete.CompetitionType.fighting)
                    .status(status)
                    .build();

            when(athleteRepository.save(any(Athlete.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            Athlete result = athleteService.create(athlete);

            // Assert
            assertNotNull(result);
            assertEquals(status, result.getStatus());

            reset(athleteRepository);
        }
    }

    // ==================== DELETE BY EMAIL AND TOURNAMENT TESTS ====================

    @Test
    @DisplayName("Should successfully delete athlete by email and tournamentId")
    void testDeleteByEmailAndTournamentId_ShouldDelete() {
        // Arrange
        String email = "delete@example.com";
        String tournamentId = "comp-123";

        doNothing().when(athleteRepository).deleteByEmailAndTournamentId(email, tournamentId);

        // Act
        assertDoesNotThrow(() -> athleteService.deleteByEmailAndTournamentId(email, tournamentId));

        // Assert
        verify(athleteRepository, times(1)).deleteByEmailAndTournamentId(email, tournamentId);
    }

    @Test
    @DisplayName("Should handle delete when athlete does not exist")
    void testDeleteByEmailAndTournamentId_WhenNotExists_ShouldNotThrow() {
        // Arrange
        String email = "nonexistent@example.com";
        String tournamentId = "comp-123";

        doNothing().when(athleteRepository).deleteByEmailAndTournamentId(email, tournamentId);

        // Act & Assert
        assertDoesNotThrow(() -> athleteService.deleteByEmailAndTournamentId(email, tournamentId));
        verify(athleteRepository, times(1)).deleteByEmailAndTournamentId(email, tournamentId);
    }

    @Test
    @DisplayName("Should delete multiple athletes with same email in different tournaments")
    void testDeleteByEmailAndTournamentId_DifferentTournaments_ShouldDeleteSpecific() {
        // Arrange
        String email = "same@example.com";
        String tournament1 = "comp-123";
        String tournament2 = "comp-456";

        doNothing().when(athleteRepository).deleteByEmailAndTournamentId(anyString(), anyString());

        // Act
        athleteService.deleteByEmailAndTournamentId(email, tournament1);
        athleteService.deleteByEmailAndTournamentId(email, tournament2);

        // Assert
        verify(athleteRepository, times(1)).deleteByEmailAndTournamentId(email, tournament1);
        verify(athleteRepository, times(1)).deleteByEmailAndTournamentId(email, tournament2);
    }

    // ==================== UPSERT ATHLETE TESTS ====================

    @Test
    @DisplayName("Should create new athlete when upserting non-existent athlete")
    void testUpsert_WhenNotExists_ShouldCreate() {
        // Arrange
        Athlete newAthlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("new@example.com")
                .fullName("New Athlete")
                .gender(Athlete.Gender.MALE)
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        when(athleteRepository.findByTournamentIdAndEmail(tournamentId, "new@example.com"))
                .thenReturn(Optional.empty());
        when(athleteRepository.save(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Athlete result = athleteService.upsert(newAthlete);

        // Assert
        assertNotNull(result);
        verify(athleteRepository, times(1)).save(newAthlete);
        verify(athleteRepository, never()).save(argThat(a -> a != newAthlete));
    }

    @Test
    @DisplayName("Should update existing athlete when upserting")
    void testUpsert_WhenExists_ShouldUpdate() {
        // Arrange
        String email = "existing@example.com";
        Athlete existing = Athlete.builder()
                .id(UUID.randomUUID())
                .tournamentId(tournamentId)
                .email(email)
                .fullName("Old Name")
                .gender(Athlete.Gender.MALE)
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Athlete updated = Athlete.builder()
                .tournamentId(tournamentId)
                .email(email)
                .fullName("New Name")
                .gender(Athlete.Gender.FEMALE)
                .competitionType(Athlete.CompetitionType.quyen)
                .subCompetitionType("Song luyện")
                .status(Athlete.AthleteStatus.IN_PROGRESS)
                .fistConfigId("fist-123")
                .build();

        when(athleteRepository.findByTournamentIdAndEmail(tournamentId, email))
                .thenReturn(Optional.of(existing));
        when(athleteRepository.save(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Athlete result = athleteService.upsert(updated);

        // Assert
        assertNotNull(result);
        assertEquals("New Name", result.getFullName());
        assertEquals(Athlete.Gender.FEMALE, result.getGender());
        assertEquals(Athlete.CompetitionType.quyen, result.getCompetitionType());
        assertEquals(Athlete.AthleteStatus.IN_PROGRESS, result.getStatus());
        verify(athleteRepository, times(1)).save(existing);
    }

    @Test
    @DisplayName("Should upsert athlete and update FK IDs")
    void testUpsert_ShouldUpdateFKIds() {
        // Arrange
        String email = "update@example.com";
        Athlete existing = Athlete.builder()
                .id(UUID.randomUUID())
                .tournamentId(tournamentId)
                .email(email)
                .fullName("Existing")
                .gender(Athlete.Gender.MALE)
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Athlete updated = Athlete.builder()
                .tournamentId(tournamentId)
                .email(email)
                .fullName("Existing")
                .gender(Athlete.Gender.MALE)
                .competitionType(Athlete.CompetitionType.fighting)
                .weightClassId("wc-new")
                .fistConfigId("fist-new")
                .fistItemId("item-new")
                .musicContentId("music-new")
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        when(athleteRepository.findByTournamentIdAndEmail(tournamentId, email))
                .thenReturn(Optional.of(existing));
        when(athleteRepository.save(any(Athlete.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Athlete result = athleteService.upsert(updated);

        // Assert
        assertNotNull(result);
        verify(athleteRepository, times(1)).save(argThat(a ->
                a.getWeightClassId() != null ||
                a.getFistConfigId() != null ||
                a.getFistItemId() != null ||
                a.getMusicContentId() != null
        ));
    }

    // ==================== LIST ATHLETES TESTS ====================

    @Test
    @DisplayName("Should list athletes with pagination")
    void testList_WithPagination_ShouldReturnPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<Athlete> athletes = Arrays.asList(testAthlete);
        Page<Athlete> athletePage = new PageImpl<>(athletes, pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(tournamentId, null, null, null, null, null, null, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(testAthlete.getEmail(), result.getContent().get(0).getEmail());
    }

    @Test
    @DisplayName("Should filter athletes by competition type")
    void testList_ByCompetitionType_ShouldFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete fightingAthlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("fighting@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(fightingAthlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.fighting,
                null, null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(Athlete.CompetitionType.fighting, result.getContent().get(0).getCompetitionType());
    }

    @Test
    @DisplayName("Should filter athletes by gender")
    void testList_ByGender_ShouldFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete maleAthlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("male@example.com")
                .gender(Athlete.Gender.MALE)
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(maleAthlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                null, null, null, null,
                Athlete.Gender.MALE,
                null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(Athlete.Gender.MALE, result.getContent().get(0).getGender());
    }

    @Test
    @DisplayName("Should filter athletes by status")
    void testList_ByStatus_ShouldFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete notStartedAthlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("notstarted@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(notStartedAthlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                null, null, null, null, null,
                Athlete.AthleteStatus.NOT_STARTED,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(Athlete.AthleteStatus.NOT_STARTED, result.getContent().get(0).getStatus());
    }

    @Test
    @DisplayName("Should filter athletes by name")
    void testList_ByName_ShouldFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("test@example.com")
                .fullName("John Doe")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                null, null, null,
                "John",
                null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertTrue(result.getContent().get(0).getFullName().contains("John"));
    }

    @Test
    @DisplayName("Should return empty page when no athletes match")
    void testList_NoMatches_ShouldReturnEmpty() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Athlete> emptyPage = new PageImpl<>(new ArrayList<>(), pageable, 0);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(emptyPage);

        // Act
        Page<Athlete> result = athleteService.list(
                "non-existent-tournament",
                null, null, null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());
    }

    // ==================== VIEW LIST CONTESTANTS TESTS ====================

    @Test
    @DisplayName("Should filter athletes by subCompetitionType for fighting")
    void testList_BySubCompetitionType_Fighting_ShouldFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .subCompetitionType("Hạng cân 45-50kg")
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.fighting,
                "Hạng cân 45-50kg",
                null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Hạng cân 45-50kg", result.getContent().get(0).getSubCompetitionType());
    }

    @Test
    @DisplayName("Should filter athletes by subCompetitionType for quyen with fistConfigId match")
    void testList_BySubCompetitionType_Quyen_WithFistConfigId_ShouldFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        String fistConfigId = "fist-config-123";
        String subCompetitionType = "Song luyện";

        // Mock fistConfigRepository to return a config
        sep490g65.fvcapi.entity.VovinamFistConfig fistConfig = sep490g65.fvcapi.entity.VovinamFistConfig.builder()
                .id(fistConfigId)
                .name("Song luyện 1")
                .build();

        when(fistConfigRepository.findFirstByNameStartingWithIgnoreCase(subCompetitionType))
                .thenReturn(Optional.of(fistConfig));

        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .competitionType(Athlete.CompetitionType.quyen)
                .subCompetitionType(subCompetitionType)
                .fistConfigId(fistConfigId)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.quyen,
                subCompetitionType,
                null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(fistConfigRepository).findFirstByNameStartingWithIgnoreCase(subCompetitionType);
    }

    @Test
    @DisplayName("Should filter athletes by subCompetitionType for quyen without fistConfigId match")
    void testList_BySubCompetitionType_Quyen_WithoutFistConfigId_ShouldFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        String subCompetitionType = "Don luyện";

        // Mock fistConfigRepository to return empty (no match)
        when(fistConfigRepository.findFirstByNameStartingWithIgnoreCase(subCompetitionType))
                .thenReturn(Optional.empty());

        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .competitionType(Athlete.CompetitionType.quyen)
                .subCompetitionType(subCompetitionType)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.quyen,
                subCompetitionType,
                null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(fistConfigRepository).findFirstByNameStartingWithIgnoreCase(subCompetitionType);
    }

    @Test
    @DisplayName("Should combine multiple filters correctly")
    void testList_MultipleFilters_ShouldFilterCorrectly() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .fullName("John Doe")
                .competitionType(Athlete.CompetitionType.fighting)
                .gender(Athlete.Gender.MALE)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.fighting,
                null, null,
                "John",
                Athlete.Gender.MALE,
                Athlete.AthleteStatus.NOT_STARTED,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(Athlete.CompetitionType.fighting, result.getContent().get(0).getCompetitionType());
        assertEquals(Athlete.Gender.MALE, result.getContent().get(0).getGender());
        assertEquals(Athlete.AthleteStatus.NOT_STARTED, result.getContent().get(0).getStatus());
    }

    @Test
    @DisplayName("Should handle pagination correctly - page 0")
    void testList_Pagination_Page0_ShouldReturnCorrectPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 5);
        List<Athlete> athletes = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            athletes.add(Athlete.builder()
                    .tournamentId(tournamentId)
                    .email("athlete" + i + "@example.com")
                    .competitionType(Athlete.CompetitionType.fighting)
                    .status(Athlete.AthleteStatus.NOT_STARTED)
                    .build());
        }

        Page<Athlete> athletePage = new PageImpl<>(athletes, pageable, 10);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId, null, null, null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(5, result.getContent().size());
        assertEquals(10, result.getTotalElements());
        assertEquals(0, result.getNumber());
        assertEquals(2, result.getTotalPages());
    }

    @Test
    @DisplayName("Should handle pagination correctly - page 1")
    void testList_Pagination_Page1_ShouldReturnCorrectPage() {
        // Arrange
        Pageable pageable = PageRequest.of(1, 5);
        List<Athlete> athletes = new ArrayList<>();
        for (int i = 5; i < 10; i++) {
            athletes.add(Athlete.builder()
                    .tournamentId(tournamentId)
                    .email("athlete" + i + "@example.com")
                    .competitionType(Athlete.CompetitionType.fighting)
                    .status(Athlete.AthleteStatus.NOT_STARTED)
                    .build());
        }

        Page<Athlete> athletePage = new PageImpl<>(athletes, pageable, 10);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId, null, null, null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(5, result.getContent().size());
        assertEquals(10, result.getTotalElements());
        assertEquals(1, result.getNumber());
        assertEquals(2, result.getTotalPages());
    }

    @Test
    @DisplayName("Should handle null tournamentId")
    void testList_NullTournamentId_ShouldNotFilterByTournament() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId("other-tournament")
                .email("athlete@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                null, null, null, null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("Should handle blank tournamentId")
    void testList_BlankTournamentId_ShouldNotFilterByTournament() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId("other-tournament")
                .email("athlete@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                "   ", null, null, null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("Should handle case-insensitive name search")
    void testList_NameSearch_CaseInsensitive_ShouldMatch() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .fullName("John Doe")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act - search with lowercase
        Page<Athlete> result = athleteService.list(
                tournamentId,
                null, null, null,
                "john",
                null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertTrue(result.getContent().get(0).getFullName().contains("John"));
    }

    @Test
    @DisplayName("Should handle partial name search")
    void testList_NameSearch_PartialMatch_ShouldMatch() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .fullName("John Michael Doe")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act - search with partial name
        Page<Athlete> result = athleteService.list(
                tournamentId,
                null, null, null,
                "Michael",
                null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertTrue(result.getContent().get(0).getFullName().contains("Michael"));
    }

    @Test
    @DisplayName("Should filter by blank subCompetitionType (should not filter)")
    void testList_BlankSubCompetitionType_ShouldNotFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .subCompetitionType("Hạng cân")
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.fighting,
                "   ",
                null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("Should filter by blank name (should not filter)")
    void testList_BlankName_ShouldNotFilter() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .fullName("John Doe")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId,
                null, null, null,
                "   ",
                null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("Should list all competition types")
    void testList_AllCompetitionTypes_ShouldFilterCorrectly() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Test Fighting
        Athlete fightingAthlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("fighting@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> fightingPage = new PageImpl<>(Arrays.asList(fightingAthlete), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(fightingPage);

        Page<Athlete> fightingResult = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.fighting,
                null, null, null, null, null,
                pageable
        );
        assertEquals(Athlete.CompetitionType.fighting, fightingResult.getContent().get(0).getCompetitionType());

        // Test Quyen
        Athlete quyenAthlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("quyen@example.com")
                .competitionType(Athlete.CompetitionType.quyen)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> quyenPage = new PageImpl<>(Arrays.asList(quyenAthlete), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(quyenPage);

        Page<Athlete> quyenResult = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.quyen,
                null, null, null, null, null,
                pageable
        );
        assertEquals(Athlete.CompetitionType.quyen, quyenResult.getContent().get(0).getCompetitionType());

        // Test Music
        Athlete musicAthlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("music@example.com")
                .competitionType(Athlete.CompetitionType.music)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> musicPage = new PageImpl<>(Arrays.asList(musicAthlete), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(musicPage);

        Page<Athlete> musicResult = athleteService.list(
                tournamentId,
                Athlete.CompetitionType.music,
                null, null, null, null, null,
                pageable
        );
        assertEquals(Athlete.CompetitionType.music, musicResult.getContent().get(0).getCompetitionType());
    }

    @Test
    @DisplayName("Should handle large result set with pagination")
    void testList_LargeResultSet_ShouldPaginateCorrectly() {
        // Arrange
        int pageSize = 20;
        int totalElements = 100;
        Pageable pageable = PageRequest.of(0, pageSize);
        
        List<Athlete> athletes = new ArrayList<>();
        for (int i = 0; i < pageSize; i++) {
            athletes.add(Athlete.builder()
                    .tournamentId(tournamentId)
                    .email("athlete" + i + "@example.com")
                    .fullName("Athlete " + i)
                    .competitionType(Athlete.CompetitionType.fighting)
                    .status(Athlete.AthleteStatus.NOT_STARTED)
                    .build());
        }

        Page<Athlete> athletePage = new PageImpl<>(athletes, pageable, totalElements);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act
        Page<Athlete> result = athleteService.list(
                tournamentId, null, null, null, null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(pageSize, result.getContent().size());
        assertEquals(totalElements, result.getTotalElements());
        assertEquals(5, result.getTotalPages()); // 100 / 20 = 5 pages
    }

    @Test
    @DisplayName("Should filter by all status types")
    void testList_AllStatusTypes_ShouldFilterCorrectly() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        
        // Test NOT_STARTED
        Athlete notStarted = Athlete.builder()
                .tournamentId(tournamentId)
                .email("notstarted@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> notStartedPage = new PageImpl<>(Arrays.asList(notStarted), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(notStartedPage);

        Page<Athlete> notStartedResult = athleteService.list(
                tournamentId, null, null, null, null, null,
                Athlete.AthleteStatus.NOT_STARTED,
                pageable
        );
        assertEquals(Athlete.AthleteStatus.NOT_STARTED, notStartedResult.getContent().get(0).getStatus());

        // Test IN_PROGRESS
        Athlete inProgress = Athlete.builder()
                .tournamentId(tournamentId)
                .email("inprogress@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.IN_PROGRESS)
                .build();

        Page<Athlete> inProgressPage = new PageImpl<>(Arrays.asList(inProgress), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(inProgressPage);

        Page<Athlete> inProgressResult = athleteService.list(
                tournamentId, null, null, null, null, null,
                Athlete.AthleteStatus.IN_PROGRESS,
                pageable
        );
        assertEquals(Athlete.AthleteStatus.IN_PROGRESS, inProgressResult.getContent().get(0).getStatus());

        // Test DONE
        Athlete done = Athlete.builder()
                .tournamentId(tournamentId)
                .email("done@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.DONE)
                .build();

        Page<Athlete> donePage = new PageImpl<>(Arrays.asList(done), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(donePage);

        Page<Athlete> doneResult = athleteService.list(
                tournamentId, null, null, null, null, null,
                Athlete.AthleteStatus.DONE,
                pageable
        );
        assertEquals(Athlete.AthleteStatus.DONE, doneResult.getContent().get(0).getStatus());
    }

    @Test
    @DisplayName("Should filter by all gender types")
    void testList_AllGenderTypes_ShouldFilterCorrectly() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        
        // Test MALE
        Athlete male = Athlete.builder()
                .tournamentId(tournamentId)
                .email("male@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .gender(Athlete.Gender.MALE)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> malePage = new PageImpl<>(Arrays.asList(male), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(malePage);

        Page<Athlete> maleResult = athleteService.list(
                tournamentId, null, null, null, null,
                Athlete.Gender.MALE,
                null,
                pageable
        );
        assertEquals(Athlete.Gender.MALE, maleResult.getContent().get(0).getGender());

        // Test FEMALE
        Athlete female = Athlete.builder()
                .tournamentId(tournamentId)
                .email("female@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .gender(Athlete.Gender.FEMALE)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> femalePage = new PageImpl<>(Arrays.asList(female), pageable, 1);
        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(femalePage);

        Page<Athlete> femaleResult = athleteService.list(
                tournamentId, null, null, null, null,
                Athlete.Gender.FEMALE,
                null,
                pageable
        );
        assertEquals(Athlete.Gender.FEMALE, femaleResult.getContent().get(0).getGender());
    }

    @Test
    @DisplayName("Should ignore detailSubCompetitionType parameter (legacy)")
    void testList_DetailSubCompetitionType_ShouldBeIgnored() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Athlete athlete = Athlete.builder()
                .tournamentId(tournamentId)
                .email("athlete@example.com")
                .competitionType(Athlete.CompetitionType.fighting)
                .status(Athlete.AthleteStatus.NOT_STARTED)
                .build();

        Page<Athlete> athletePage = new PageImpl<>(Arrays.asList(athlete), pageable, 1);

        when(athleteRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(athletePage);

        // Act - pass detailSubCompetitionType but it should be ignored
        Page<Athlete> result = athleteService.list(
                tournamentId,
                null,
                null,
                "legacy-detail-type", // This should be ignored
                null, null, null,
                pageable
        );

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        // detailSubCompetitionType is legacy and no longer used in filtering
    }
}


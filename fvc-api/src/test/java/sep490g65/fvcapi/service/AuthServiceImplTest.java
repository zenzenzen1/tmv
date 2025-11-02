package sep490g65.fvcapi.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.response.LoginResponse;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.service.impl.AuthServiceImpl;
import sep490g65.fvcapi.utils.JwtUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private LoginRequest validLoginRequest;
    private LoginRequest invalidPasswordRequest;
    private LoginRequest nonExistentUserRequest;
    private String hashedPassword;

    @BeforeEach
    void setUp() {
        hashedPassword = "$2a$10$exampleHashedPassword";
        
        testUser = new User();
        testUser.setId("user-123");
        testUser.setFullName("John Doe");
        testUser.setPersonalMail("john.doe@example.com");
        testUser.setEduMail("john.doe@student.edu");
        testUser.setStudentCode("STU001");
        testUser.setHashPassword(hashedPassword);
        testUser.setSystemRole(SystemRole.ADMIN);

        validLoginRequest = LoginRequest.builder()
                .email("john.doe@example.com")
                .password("correctPassword123")
                .build();

        invalidPasswordRequest = LoginRequest.builder()
                .email("john.doe@example.com")
                .password("wrongPassword")
                .build();

        nonExistentUserRequest = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("anyPassword")
                .build();
    }

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void testLogin_WithValidCredentials_ShouldReturnLoginResponse() {
        // Arrange
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(validLoginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("user-123", response.getId());
        assertEquals("John Doe", response.getFullName());
        assertEquals("john.doe@example.com", response.getPersonalMail());
        assertEquals("john.doe@student.edu", response.getEduMail());
        assertEquals("STU001", response.getStudentCode());
        assertEquals(SystemRole.ADMIN, response.getSystemRole());
        assertEquals("Login successful", response.getMessage());

        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
        verify(passwordEncoder, times(1)).matches("correctPassword123", hashedPassword);
        verify(jwtUtils, times(1)).generateTokenFromEmail("john.doe@example.com");
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when user not found")
    void testLogin_WithNonExistentUser_ShouldThrowBadCredentialsException() {
        // Arrange
        when(userRepository.findByPersonalMailIgnoreCase("nonexistent@example.com"))
                .thenReturn(Optional.empty());

        // Act & Assert
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(nonExistentUserRequest)
        );

        // The exception is caught and rethrown with generic message in the catch block
        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("nonexistent@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtUtils, never()).generateTokenFromEmail(anyString());
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when password is incorrect")
    void testLogin_WithInvalidPassword_ShouldThrowBadCredentialsException() {
        // Arrange
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", hashedPassword))
                .thenReturn(false);

        // Act & Assert
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(invalidPasswordRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
        verify(passwordEncoder, times(1)).matches("wrongPassword", hashedPassword);
        verify(jwtUtils, never()).generateTokenFromEmail(anyString());
    }

    @Test
    @DisplayName("Should trim email when searching for user")
    void testLogin_WithEmailWithWhitespace_ShouldTrimEmail() {
        // Arrange
        LoginRequest requestWithWhitespace = LoginRequest.builder()
                .email("  john.doe@example.com  ")
                .password("correctPassword123")
                .build();

        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(requestWithWhitespace);

        // Assert
        assertNotNull(response);
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
    }

    @Test
    @DisplayName("Should handle case-insensitive email lookup")
    void testLogin_WithDifferentCaseEmail_ShouldFindUser() {
        // Arrange
        LoginRequest upperCaseEmailRequest = LoginRequest.builder()
                .email("JOHN.DOE@EXAMPLE.COM")
                .password("correctPassword123")
                .build();

        when(userRepository.findByPersonalMailIgnoreCase("JOHN.DOE@EXAMPLE.COM"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(upperCaseEmailRequest);

        // Assert
        assertNotNull(response);
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("JOHN.DOE@EXAMPLE.COM");
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when user has null password hash")
    void testLogin_WithNullPasswordHash_ShouldThrowBadCredentialsException() {
        // Arrange
        testUser.setHashPassword(null);
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", null))
                .thenReturn(false);

        // Act & Assert
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(validLoginRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
        verify(passwordEncoder, times(1)).matches("correctPassword123", null);
    }

    @Test
    @DisplayName("Should successfully login with different system roles")
    void testLogin_WithDifferentSystemRoles_ShouldReturnCorrectRole() {
        // Arrange
        testUser.setSystemRole(SystemRole.MEMBER);
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(validLoginRequest);

        // Assert
        assertNotNull(response);
        assertEquals(SystemRole.MEMBER, response.getSystemRole());
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when user has empty password hash")
    void testLogin_WithEmptyPasswordHash_ShouldThrowBadCredentialsException() {
        // Arrange
        testUser.setHashPassword("");
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", ""))
                .thenReturn(false);

        // Act & Assert
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(validLoginRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verify(passwordEncoder, times(1)).matches("correctPassword123", "");
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when repository throws exception")
    void testLogin_WhenRepositoryThrowsException_ShouldThrowBadCredentialsException() {
        // Arrange
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenThrow(new RuntimeException("Database connection error"));

        // Act & Assert
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(validLoginRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when password encoder throws exception")
    void testLogin_WhenPasswordEncoderThrowsException_ShouldThrowBadCredentialsException() {
        // Arrange
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenThrow(new RuntimeException("Encoder error"));

        // Act & Assert
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(validLoginRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
        verify(passwordEncoder, times(1)).matches("correctPassword123", hashedPassword);
    }

    @Test
    @DisplayName("Should handle login with minimum password length (6 characters)")
    void testLogin_WithMinimumPasswordLength_ShouldSucceed() {
        // Arrange
        LoginRequest minPasswordRequest = LoginRequest.builder()
                .email("john.doe@example.com")
                .password("pass12") // 6 characters
                .build();

        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("pass12", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(minPasswordRequest);

        // Assert
        assertNotNull(response);
        verify(passwordEncoder, times(1)).matches("pass12", hashedPassword);
    }

    @Test
    @DisplayName("Should handle login with very long password")
    void testLogin_WithVeryLongPassword_ShouldSucceed() {
        // Arrange
        String longPassword = "a".repeat(1000);
        LoginRequest longPasswordRequest = LoginRequest.builder()
                .email("john.doe@example.com")
                .password(longPassword)
                .build();

        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(longPassword, hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(longPasswordRequest);

        // Assert
        assertNotNull(response);
        verify(passwordEncoder, times(1)).matches(longPassword, hashedPassword);
    }

    @Test
    @DisplayName("Should handle login with email containing special characters")
    void testLogin_WithEmailContainingSpecialCharacters_ShouldSucceed() {
        // Arrange
        LoginRequest specialEmailRequest = LoginRequest.builder()
                .email("user+tag@example.com")
                .password("correctPassword123")
                .build();

        User specialUser = new User();
        specialUser.setId("user-456");
        specialUser.setPersonalMail("user+tag@example.com");
        specialUser.setHashPassword(hashedPassword);
        specialUser.setSystemRole(SystemRole.ATHLETE);

        when(userRepository.findByPersonalMailIgnoreCase("user+tag@example.com"))
                .thenReturn(Optional.of(specialUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("user+tag@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(specialEmailRequest);

        // Assert
        assertNotNull(response);
        assertEquals("user+tag@example.com", response.getPersonalMail());
    }

    @Test
    @DisplayName("Should handle login with email containing numbers")
    void testLogin_WithEmailContainingNumbers_ShouldSucceed() {
        // Arrange
        LoginRequest numericEmailRequest = LoginRequest.builder()
                .email("user123@example.com")
                .password("correctPassword123")
                .build();

        User numericUser = new User();
        numericUser.setId("user-789");
        numericUser.setPersonalMail("user123@example.com");
        numericUser.setHashPassword(hashedPassword);
        numericUser.setSystemRole(SystemRole.TEACHER);

        when(userRepository.findByPersonalMailIgnoreCase("user123@example.com"))
                .thenReturn(Optional.of(numericUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("user123@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(numericEmailRequest);

        // Assert
        assertNotNull(response);
        assertEquals("user123@example.com", response.getPersonalMail());
    }

    @Test
    @DisplayName("Should handle login with all system roles")
    void testLogin_WithAllSystemRoles_ShouldReturnCorrectRole() {
        SystemRole[] roles = {
                SystemRole.MEMBER,
                SystemRole.ATHLETE,
                SystemRole.TEACHER,
                SystemRole.EXECUTIVE_BOARD,
                SystemRole.ORGANIZATION_COMMITTEE,
                SystemRole.ADMIN
        };

        for (SystemRole role : roles) {
            // Arrange
            testUser.setSystemRole(role);
            when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                    .thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches("correctPassword123", hashedPassword))
                    .thenReturn(true);
            when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                    .thenReturn("mock-jwt-token");

            // Act
            LoginResponse response = authService.login(validLoginRequest);

            // Assert
            assertNotNull(response);
            assertEquals(role, response.getSystemRole());
        }
    }

    @Test
    @DisplayName("Should handle login with user having null optional fields")
    void testLogin_WithUserHavingNullOptionalFields_ShouldSucceed() {
        // Arrange
        User minimalUser = new User();
        minimalUser.setId("user-minimal");
        minimalUser.setPersonalMail("minimal@example.com");
        minimalUser.setHashPassword(hashedPassword);
        minimalUser.setSystemRole(SystemRole.MEMBER);
        // null fields: fullName, eduMail, studentCode

        LoginRequest minimalRequest = LoginRequest.builder()
                .email("minimal@example.com")
                .password("correctPassword123")
                .build();

        when(userRepository.findByPersonalMailIgnoreCase("minimal@example.com"))
                .thenReturn(Optional.of(minimalUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("minimal@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(minimalRequest);

        // Assert
        assertNotNull(response);
        assertEquals("user-minimal", response.getId());
        assertEquals("minimal@example.com", response.getPersonalMail());
        assertEquals(SystemRole.MEMBER, response.getSystemRole());
    }

    @Test
    @DisplayName("Should handle login with email having multiple spaces")
    void testLogin_WithEmailHavingMultipleSpaces_ShouldTrimCorrectly() {
        // Arrange
        LoginRequest spacedEmailRequest = LoginRequest.builder()
                .email("   john.doe@example.com   ")
                .password("correctPassword123")
                .build();

        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(spacedEmailRequest);

        // Assert
        assertNotNull(response);
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
    }

    @Test
    @DisplayName("Should throw BadCredentialsException when JWT generation throws exception")
    void testLogin_WhenJwtGenerationThrowsException_ShouldThrowBadCredentialsException() {
        // Arrange
        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("correctPassword123", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenThrow(new RuntimeException("JWT generation failed"));

        // Act & Assert
        BadCredentialsException exception = assertThrows(
                BadCredentialsException.class,
                () -> authService.login(validLoginRequest)
        );

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository, times(1)).findByPersonalMailIgnoreCase("john.doe@example.com");
        verify(passwordEncoder, times(1)).matches("correctPassword123", hashedPassword);
        verify(jwtUtils, times(1)).generateTokenFromEmail("john.doe@example.com");
    }

    @Test
    @DisplayName("Should handle login with password containing special characters")
    void testLogin_WithPasswordContainingSpecialCharacters_ShouldSucceed() {
        // Arrange
        LoginRequest specialPasswordRequest = LoginRequest.builder()
                .email("john.doe@example.com")
                .password("P@ssw0rd!#$%")
                .build();

        when(userRepository.findByPersonalMailIgnoreCase("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("P@ssw0rd!#$%", hashedPassword))
                .thenReturn(true);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenReturn("mock-jwt-token");

        // Act
        LoginResponse response = authService.login(specialPasswordRequest);

        // Assert
        assertNotNull(response);
        verify(passwordEncoder, times(1)).matches("P@ssw0rd!#$%", hashedPassword);
    }
}


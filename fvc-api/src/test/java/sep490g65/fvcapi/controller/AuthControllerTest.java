package sep490g65.fvcapi.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.dto.response.LoginResponse;
import sep490g65.fvcapi.enums.SystemRole;
import sep490g65.fvcapi.service.AuthService;
import sep490g65.fvcapi.utils.JwtUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController Unit Tests")
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private HttpServletResponse httpServletResponse;

    @InjectMocks
    private AuthController authController;

    private LoginRequest validLoginRequest;
    private LoginResponse loginResponse;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        validLoginRequest = LoginRequest.builder()
                .email("john.doe@example.com")
                .password("correctPassword123")
                .build();

        loginResponse = LoginResponse.builder()
                .id("user-123")
                .fullName("John Doe")
                .personalMail("john.doe@example.com")
                .eduMail("john.doe@student.edu")
                .studentCode("STU001")
                .systemRole(SystemRole.ADMIN)
                .message("Login successful")
                .build();

        jwtToken = "mock-jwt-token-string";
    }

    @Test
    @DisplayName("Should successfully login and return 200 with JWT cookie")
    void testLogin_WithValidCredentials_ShouldReturnSuccess() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest, 
                httpServletResponse
        );

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Login successful", response.getBody().getMessage());
        assertNotNull(response.getBody().getData());
        assertEquals("user-123", response.getBody().getData().getId());
        assertEquals("John Doe", response.getBody().getData().getFullName());
        assertEquals(SystemRole.ADMIN, response.getBody().getData().getSystemRole());

        verify(authService, times(1)).login(validLoginRequest);
        verify(jwtUtils, times(1)).generateTokenFromEmail("john.doe@example.com");
        verify(httpServletResponse, times(1)).addCookie(any(Cookie.class));
    }

    @Test
    @DisplayName("Should set correct cookie properties on successful login")
    void testLogin_WithValidCredentials_ShouldSetCorrectCookieProperties() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        authController.login(validLoginRequest, httpServletResponse);

        // Assert
        verify(httpServletResponse, times(1)).addCookie(argThat(cookie -> {
            return "jwt".equals(cookie.getName()) &&
                   jwtToken.equals(cookie.getValue()) &&
                   cookie.isHttpOnly() &&
                   !cookie.getSecure() && // false in test/dev
                   "/".equals(cookie.getPath()) &&
                   cookie.getMaxAge() == 30 * 60; // 30 minutes
        }));
    }

    @Test
    @DisplayName("Should return 401 when authentication fails")
    void testLogin_WithInvalidCredentials_ShouldReturnUnauthorized() {
        // Arrange
        when(authService.login(validLoginRequest))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Invalid email or password", response.getBody().getMessage());
        assertEquals("AUTH_FAILED", response.getBody().getErrorCode());
        assertNull(response.getBody().getData());

        verify(authService, times(1)).login(validLoginRequest);
        verify(jwtUtils, never()).generateTokenFromEmail(anyString());
        verify(httpServletResponse, never()).addCookie(any(Cookie.class));
    }

    @Test
    @DisplayName("Should return 401 when user not found")
    void testLogin_WithNonExistentUser_ShouldReturnUnauthorized() {
        // Arrange
        LoginRequest nonExistentRequest = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("anyPassword")
                .build();

        when(authService.login(nonExistentRequest))
                .thenThrow(new BadCredentialsException("User not found"));

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                nonExistentRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("AUTH_FAILED", response.getBody().getErrorCode());
    }

    @Test
    @DisplayName("Should handle generic exceptions and return 401")
    void testLogin_WithGenericException_ShouldReturnUnauthorized() {
        // Arrange
        when(authService.login(validLoginRequest))
                .thenThrow(new RuntimeException("Unexpected error"));

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Invalid email or password", response.getBody().getMessage());
        assertEquals("AUTH_FAILED", response.getBody().getErrorCode());
    }

    @Test
    @DisplayName("Should generate JWT token using email from request")
    void testLogin_ShouldGenerateJwtTokenFromRequestEmail() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        authController.login(validLoginRequest, httpServletResponse);

        // Assert
        verify(jwtUtils, times(1)).generateTokenFromEmail("john.doe@example.com");
    }

    @Test
    @DisplayName("Should return correct user data in response")
    void testLogin_ShouldReturnCorrectUserData() {
        // Arrange
        loginResponse.setSystemRole(SystemRole.MEMBER);
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        LoginResponse responseData = response.getBody().getData();
        assertEquals("user-123", responseData.getId());
        assertEquals("John Doe", responseData.getFullName());
        assertEquals("john.doe@example.com", responseData.getPersonalMail());
        assertEquals("john.doe@student.edu", responseData.getEduMail());
        assertEquals("STU001", responseData.getStudentCode());
        assertEquals(SystemRole.MEMBER, responseData.getSystemRole());
    }

    @Test
    @DisplayName("Should call authService.login exactly once")
    void testLogin_ShouldCallAuthServiceOnce() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        authController.login(validLoginRequest, httpServletResponse);

        // Assert
        verify(authService, times(1)).login(validLoginRequest);
        verifyNoMoreInteractions(authService);
    }

    @Test
    @DisplayName("Should return 401 when JWT generation fails")
    void testLogin_WhenJwtGenerationFails_ShouldReturnUnauthorized() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com"))
                .thenThrow(new RuntimeException("JWT generation error"));

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("AUTH_FAILED", response.getBody().getErrorCode());
    }

    @Test
    @DisplayName("Should handle login with very long JWT token")
    void testLogin_WithVeryLongJwtToken_ShouldSetCookie() {
        // Arrange
        String veryLongToken = "a".repeat(2000);
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(veryLongToken);

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(httpServletResponse, times(1)).addCookie(argThat(cookie ->
                veryLongToken.equals(cookie.getValue())
        ));
    }

    @Test
    @DisplayName("Should return 401 when NullPointerException occurs")
    void testLogin_WhenNullPointerExceptionOccurs_ShouldReturnUnauthorized() {
        // Arrange
        when(authService.login(validLoginRequest))
                .thenThrow(new NullPointerException("Null value encountered"));

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("AUTH_FAILED", response.getBody().getErrorCode());
    }

    @Test
    @DisplayName("Should return 401 when IllegalArgumentException occurs")
    void testLogin_WhenIllegalArgumentExceptionOccurs_ShouldReturnUnauthorized() {
        // Arrange
        when(authService.login(validLoginRequest))
                .thenThrow(new IllegalArgumentException("Invalid argument"));

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
    }

    @Test
    @DisplayName("Should handle login with all system roles and verify response")
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
            loginResponse.setSystemRole(role);
            when(authService.login(validLoginRequest)).thenReturn(loginResponse);
            when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

            // Act
            ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                    validLoginRequest,
                    httpServletResponse
            );

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(role, response.getBody().getData().getSystemRole());
        }
    }

    @Test
    @DisplayName("Should handle login with user having null fields in response")
    void testLogin_WithUserHavingNullFields_ShouldHandleGracefully() {
        // Arrange
        LoginResponse nullFieldsResponse = LoginResponse.builder()
                .id("user-123")
                .personalMail("test@example.com")
                .systemRole(SystemRole.MEMBER)
                .message("Login successful")
                .build();
        // null fields: fullName, eduMail, studentCode

        when(authService.login(validLoginRequest)).thenReturn(nullFieldsResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getData());
        assertEquals("user-123", response.getBody().getData().getId());
    }

    @Test
    @DisplayName("Should verify response contains timestamp")
    void testLogin_ShouldContainTimestamp() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertNotNull(response.getBody().getTimestamp());
    }

    @Test
    @DisplayName("Should handle multiple sequential login attempts")
    void testLogin_WithMultipleSequentialAttempts_ShouldHandleEach() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act - First attempt
        ResponseEntity<BaseResponse<LoginResponse>> response1 = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Act - Second attempt
        ResponseEntity<BaseResponse<LoginResponse>> response2 = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertEquals(HttpStatus.OK, response1.getStatusCode());
        assertEquals(HttpStatus.OK, response2.getStatusCode());
        verify(authService, times(2)).login(validLoginRequest);
        verify(httpServletResponse, times(2)).addCookie(any(Cookie.class));
    }

    @Test
    @DisplayName("Should handle login with different email formats")
    void testLogin_WithDifferentEmailFormats_ShouldGenerateToken() {
        String[] emails = {
                "user@example.com",
                "user.name@example.com",
                "user+tag@example.com",
                "user123@example.com",
                "user_name@example.com"
        };

        for (String email : emails) {
            // Arrange
            LoginRequest emailRequest = LoginRequest.builder()
                    .email(email)
                    .password("password123")
                    .build();

            LoginResponse emailResponse = LoginResponse.builder()
                    .id("user-id")
                    .personalMail(email)
                    .systemRole(SystemRole.MEMBER)
                    .message("Login successful")
                    .build();

            when(authService.login(emailRequest)).thenReturn(emailResponse);
            when(jwtUtils.generateTokenFromEmail(email)).thenReturn("token-" + email);

            // Act
            ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                    emailRequest,
                    httpServletResponse
            );

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(jwtUtils, times(1)).generateTokenFromEmail(email);
        }
    }

    @Test
    @DisplayName("Should verify cookie is not set when authentication fails")
    void testLogin_WhenAuthenticationFails_CookieShouldNotBeSet() {
        // Arrange
        when(authService.login(validLoginRequest))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act
        authController.login(validLoginRequest, httpServletResponse);

        // Assert
        verify(httpServletResponse, never()).addCookie(any(Cookie.class));
        verify(jwtUtils, never()).generateTokenFromEmail(anyString());
    }

    @Test
    @DisplayName("Should return response with success flag true on valid login")
    void testLogin_WithValidCredentials_ShouldSetSuccessFlagTrue() {
        // Arrange
        when(authService.login(validLoginRequest)).thenReturn(loginResponse);
        when(jwtUtils.generateTokenFromEmail("john.doe@example.com")).thenReturn(jwtToken);

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertTrue(response.getBody().isSuccess());
        assertNull(response.getBody().getErrorCode());
    }

    @Test
    @DisplayName("Should return response with success flag false on failed login")
    void testLogin_WithInvalidCredentials_ShouldSetSuccessFlagFalse() {
        // Arrange
        when(authService.login(validLoginRequest))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act
        ResponseEntity<BaseResponse<LoginResponse>> response = authController.login(
                validLoginRequest,
                httpServletResponse
        );

        // Assert
        assertFalse(response.getBody().isSuccess());
        assertNotNull(response.getBody().getErrorCode());
    }
}


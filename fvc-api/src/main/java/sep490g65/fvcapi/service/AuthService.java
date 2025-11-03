package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.request.RegisterRequest;
import sep490g65.fvcapi.dto.response.LoginResponse;
import sep490g65.fvcapi.dto.response.RegisterResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    RegisterResponse register(RegisterRequest request);
}

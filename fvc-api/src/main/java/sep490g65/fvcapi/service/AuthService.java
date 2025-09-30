package sep490g65.fvcapi.service;

import sep490g65.fvcapi.dto.request.LoginRequest;
import sep490g65.fvcapi.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}

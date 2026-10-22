package com.vayam.music.controller;

import com.vayam.music.dto.AuthResponse;
import com.vayam.music.dto.LoginRequest;
import com.vayam.music.dto.RegisterRequest;
import com.vayam.music.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final com.vayam.music.service.GoogleAuthService googleAuthService;

    public AuthController(AuthService authService, com.vayam.music.service.GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody com.vayam.music.dto.GoogleAuthRequest request) {
        return googleAuthService.authenticateGoogleUser(request.idToken());
    }

    @GetMapping("/google/config")
    public java.util.Map<String, Object> getGoogleConfig() {
        return java.util.Map.of(
                "clientId", googleAuthService.getGoogleClientId(),
                "configured", !googleAuthService.getGoogleClientId().isBlank()
        );
    }
}
